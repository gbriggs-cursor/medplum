// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { BackgroundImage, Box, SimpleGrid, Stack } from '@mantine/core';
import { SignInForm } from '@medplum/react';
import type { JSX } from 'react';
import { useNavigate } from 'react-router';
import { Logo } from '../components/Logo';
import LabImage from '../img/landingPage/laboratory.jpg';
import { copy } from '../theme';

export function SignInPage(): JSX.Element {
  const navigate = useNavigate();
  return (
    <SimpleGrid cols={{ base: 1, md: 2 }}>
      <Box pt={100} pb={200} px="md">
        <SignInForm
          projectId={import.meta.env.FOOMEDICAL_PROJECT_ID}
          googleClientId={import.meta.env.GOOGLE_CLIENT_ID}
          clientId={import.meta.env.MEDPLUM_CLIENT_ID}
          onSuccess={() => navigate('/')?.catch(console.error)}
        >
          <Stack align="center" gap="sm" mb="md">
            <Logo width={200} />
            <h2>{copy.signInTitle}</h2>
          </Stack>
        </SignInForm>
      </Box>
      <BackgroundImage visibleFrom="md" src={LabImage} mih="100vh" />
    </SimpleGrid>
  );
}
