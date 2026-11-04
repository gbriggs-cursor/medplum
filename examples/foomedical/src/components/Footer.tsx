// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { Anchor, Container, Divider, SimpleGrid, Stack, Text } from '@mantine/core';
import type { JSX } from 'react';
import { footerCopyright } from '../theme';
import classes from './Footer.module.css';

export function Footer(): JSX.Element {
  return (
    <footer className={classes.footer}>
      <div className={classes.inner}>
        <Container p="xl">
          <Stack gap="xl">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
              <Anchor href="https://www.medplum.com/docs/tutorials/api-basics/create-fhir-data">Getting started</Anchor>
              <Anchor href="https://www.medplum.com/docs/tutorials">Playing with Medplum</Anchor>
              <Anchor href="https://github.com/medplum/foomedical">Open Source</Anchor>
              <Anchor href="https://www.medplum.com/docs">Documentation</Anchor>
            </SimpleGrid>
            <Divider />
            <Text c="dimmed" size="sm">
              {footerCopyright(new Date().getFullYear())}
            </Text>
          </Stack>
        </Container>
      </div>
    </footer>
  );
}
