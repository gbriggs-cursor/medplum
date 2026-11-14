// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import type { JSX } from 'react';
import LogoImage from '../img/logo.svg';
import { brand } from '../theme';

export interface LogoProps {
  readonly width: number;
}

export function Logo(props: LogoProps): JSX.Element {
  const width = props.width;
  const height = Math.round((48 / 240) * width);
  return <img src={LogoImage} alt={brand.productName} width={width} height={height} style={{ display: 'block' }} />;
}
