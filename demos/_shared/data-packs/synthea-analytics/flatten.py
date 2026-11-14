#!/usr/bin/env python3
"""Flattens Synthea CSV output into clean Parquet tables.

    flatten.py <synthea_csv_dir> <out_parquet_dir> [--seed 20261112]

Event tables are limited to the analysis window. device_readings is synthesized from the
Synthea glucose meters and each patient's HbA1c history (deterministic for a given seed).
Every row is synthetic; patients carry synthetic=true and tag='HTEST'.
"""

import argparse
import os
import shutil

import duckdb

WINDOW_START = "2023-10-01"
WINDOW_END = "2026-10-01"
READINGS_START = "2025-10-01"
GLUCOSE_METER = "337414009"
DEVICE_MODELS = ["GlucoSense G2", "GlucoSense G3", "GlucoSense G3 Plus"]

TABLES = {
    "patients": f"""
        select Id as id, BIRTHDATE::date as birthdate, DEATHDATE::date as deathdate, SSN as ssn,
               FIRST as first, MIDDLE as middle, LAST as last, GENDER as gender, RACE as race,
               ETHNICITY as ethnicity, ADDRESS as address, CITY as city, COUNTY as county,
               STATE as state, ZIP::varchar as zip, LAT as lat, LON as lon,
               true as synthetic, 'HTEST' as tag
        from read_csv('{{d}}/patients.csv', header=true, all_varchar=true)
    """,
    "organizations": """
        select Id as id, NAME as name, CITY as city, STATE as state, ZIP::varchar as zip
        from read_csv('{d}/organizations.csv', header=true, all_varchar=true)
    """,
    "providers": """
        select Id as id, ORGANIZATION as organization, NAME as name, SPECIALITY as speciality
        from read_csv('{d}/providers.csv', header=true, all_varchar=true)
    """,
    "encounters": f"""
        select Id as id, START::timestamp as start, STOP::timestamp as stop, PATIENT as patient,
               ORGANIZATION as organization, PROVIDER as provider, ENCOUNTERCLASS as encounter_class,
               CODE as code, DESCRIPTION as description, REASONCODE as reason_code,
               REASONDESCRIPTION as reason_description
        from read_csv('{{d}}/encounters.csv', header=true, all_varchar=true)
        where START::timestamp >= '{WINDOW_START}' and START::timestamp < '{WINDOW_END}'
    """,
    "conditions": """
        select START::date as start, STOP::date as stop, PATIENT as patient, ENCOUNTER as encounter,
               SYSTEM as system, CODE as code, DESCRIPTION as description
        from read_csv('{d}/conditions.csv', header=true, all_varchar=true)
    """,
    "observations": f"""
        select DATE::timestamp as date, PATIENT as patient, ENCOUNTER as encounter,
               CATEGORY as category, CODE as code, DESCRIPTION as description,
               try_cast(VALUE as double) as value_num,
               case when try_cast(VALUE as double) is null then VALUE end as value_text,
               UNITS as units, TYPE as type
        from read_csv('{{d}}/observations.csv', header=true, all_varchar=true)
        where DATE::timestamp >= '{WINDOW_START}' and DATE::timestamp < '{WINDOW_END}'
    """,
    "medications": f"""
        select START::timestamp as start, STOP::timestamp as stop, PATIENT as patient,
               ENCOUNTER as encounter, CODE as code, DESCRIPTION as description,
               DISPENSES::int as dispenses
        from read_csv('{{d}}/medications.csv', header=true, all_varchar=true)
        where coalesce(STOP::timestamp, '{WINDOW_END}'::timestamp) >= '{WINDOW_START}'
    """,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("csv_dir")
    ap.add_argument("out_dir")
    ap.add_argument("--seed", type=int, default=20261112)
    args = ap.parse_args()

    if os.path.isdir(args.out_dir):
        shutil.rmtree(args.out_dir)
    os.makedirs(args.out_dir)
    con = duckdb.connect()
    con.execute("set threads to 8")

    for name, sql in TABLES.items():
        con.execute(f"create table {name} as {sql.format(d=args.csv_dir)}")

    models = ", ".join(f"'{m}'" for m in DEVICE_MODELS)
    con.execute(
        f"""
        create table devices as
        select md5(UDI) as device_id, START::timestamp as start, STOP::timestamp as stop,
               PATIENT as patient, ENCOUNTER as encounter, CODE as code, DESCRIPTION as description,
               UDI as udi,
               case when CODE = '{GLUCOSE_METER}'
                    then [{models}][1 + (hash(UDI || '{args.seed}') % {len(DEVICE_MODELS)})::int]
               end as model
        from read_csv('{args.csv_dir}/devices.csv', header=true, all_varchar=true)
        where coalesce(STOP::timestamp, '{WINDOW_END}'::timestamp) >= '{WINDOW_START}'
        """
    )

    con.execute(
        f"""
        create table device_readings as
        with meters as (
            select device_id, patient, model,
                   greatest(start::date, '{READINGS_START}'::date) as d0,
                   least(coalesce(stop::date, '{WINDOW_END}'::date), '{WINDOW_END}'::date) as d1
            from devices
            where code = '{GLUCOSE_METER}'
        ),
        days as (
            select m.device_id, m.patient, m.model, unnest(generate_series(m.d0, m.d1 - 1, interval 1 day))::date as day
            from meters m
            where m.d1 > m.d0
        ),
        a1c as (
            select patient, date, value_num
            from observations
            where code = '4548-4' and units = '%'
        ),
        joined as (
            select d.*, a.value_num as a1c
            from days d
            asof left join a1c a on a.patient = d.patient and d.day::timestamp >= a.date
        )
        select device_id, patient, model, day as reading_date,
               day + interval (6 + (hash(device_id || day::varchar || '{args.seed}') % 14)::int) hour as reading_time,
               round(
                   (28.7 * coalesce(a1c, 6.0) - 46.7)
                   + ((hash(device_id || day::varchar || 'g{args.seed}') % 4001)::double / 100.0 - 20.0),
                   0
               ) as glucose_mg_dl,
               'mg/dL' as units
        from joined
        """
    )

    for name in [*TABLES.keys(), "devices", "device_readings"]:
        out = os.path.join(args.out_dir, f"{name}.parquet")
        con.execute(f"copy (select * from {name} order by all) to '{out}' (format parquet, compression zstd)")
        n = con.execute(f"select count(*) from {name}").fetchone()[0]
        print(f"flatten: {name:16} {n:>10} rows")


if __name__ == "__main__":
    main()
