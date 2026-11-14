#!/usr/bin/env python3
"""Run every named query in queries.sql against the analytics pack and write results.md.

Uses ~/.cache/medplum-demos/synthea-analytics-10k when present, otherwise the committed fixture-100.
Override with L13_DATA_DIR.
"""

import os
import re
import sys
from pathlib import Path

import duckdb

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
TABLES = [
    'patients', 'organizations', 'providers', 'encounters', 'conditions',
    'observations', 'medications', 'devices', 'device_readings',
]


def data_dir() -> Path:
    if os.environ.get('L13_DATA_DIR'):
        return Path(os.environ['L13_DATA_DIR']).expanduser()
    p2 = Path('~/.cache/medplum-demos/synthea-analytics-10k').expanduser()
    if (p2 / 'parquet').is_dir():
        return p2
    return REPO / 'demos/_shared/data-packs/synthea-analytics/fixture-100'


def markdown(cols, rows) -> str:
    def fmt(v):
        if v is None:
            return ''
        if isinstance(v, float):
            return f'{v:g}'
        return str(v)

    out = ['| ' + ' | '.join(cols) + ' |', '| ' + ' | '.join('---' for _ in cols) + ' |']
    out += ['| ' + ' | '.join(fmt(v) for v in r) + ' |' for r in rows]
    return '\n'.join(out)


def main() -> int:
    src = data_dir()
    con = duckdb.connect()
    for t in TABLES:
        con.execute(f"CREATE VIEW {t} AS SELECT * FROM read_parquet('{src / 'parquet' / (t + '.parquet')}')")

    text = (HERE / 'queries.sql').read_text()
    blocks = re.split(r'^-- name: (\S+)\n', text, flags=re.M)[1:]
    out = [f'# Query results\n\nData: `{src}`\n']
    for name, body in zip(blocks[::2], blocks[1::2]):
        sql = body.strip().rstrip(';')
        rel = con.sql(sql)
        out.append(f'## {name}\n\n{markdown(rel.columns, rel.fetchall())}\n')
    (HERE / 'results.md').write_text('\n'.join(out))
    print(f'{len(blocks) // 2} queries against {src} -> results.md')
    return 0


if __name__ == '__main__':
    sys.exit(main())
