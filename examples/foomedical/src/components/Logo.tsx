// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { JSX } from 'react';
import logoUrl from '../img/logo-bsc.svg';
import { brand } from '../theme';

export interface LogoProps {
  readonly width: number;
}

export function Logo(props: LogoProps): JSX.Element {
  return (
    <img
      src={logoUrl}
      alt={brand.productName}
      width={props.width}
      style={{ width: props.width, height: 'auto', maxHeight: 36 }}
    />
  );
}
