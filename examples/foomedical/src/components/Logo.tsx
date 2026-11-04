// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { JSX } from 'react';
import logo from '../img/logo-bsc.svg';
import { brand } from '../theme';

export interface LogoProps {
  readonly width: number;
}

const LOGO_ASPECT = 33 / 96;

export function Logo(props: LogoProps): JSX.Element {
  const width = props.width;
  const height = Math.round(width * LOGO_ASPECT);
  return (
    <img src={logo} alt={brand.productName} width={width} height={height} style={{ width, height, display: 'block' }} />
  );
}
