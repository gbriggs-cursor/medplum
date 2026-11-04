// SPDX-FileCopyrightText: Copyright Orangebot, Inc. and Medplum contributors
// SPDX-License-Identifier: Apache-2.0
import { AppShell, Box, Button, Container, Group, Stack, Text, Title, useMantineTheme } from '@mantine/core';
import cx from 'clsx';
import type { JSX } from 'react';
import { Footer } from '../../components/Footer';
import DoctorImage from '../../img/landingPage/doctor.jpg';
import EngineeringImage from '../../img/landingPage/engineering.jpg';
import LabImage from '../../img/landingPage/laboratory.jpg';
import WorkingEnvironmentImage from '../../img/landingPage/working-environment.jpg';
import { copy } from '../../theme';
import { Header } from './Header';
import classes from './index.module.css';

const features = [
  {
    title: 'Comprehensive care plans',
    description: 'See the next steps your care team recommends after a companion diagnostic result.',
  },
  {
    title: 'Clear access',
    description: 'Review results and messages in one place, with no hidden portal fees in this demo.',
  },
  {
    title: '24/7 messaging',
    description: 'Send questions to your care team when you need them — this demo uses synthetic data only.',
  },
  {
    title: 'Clinically rigorous',
    description: 'Built for companion diagnostics workflows with the same structure your clinic already uses.',
  },
];

export function LandingPage(): JSX.Element {
  const theme = useMantineTheme();
  return (
    <AppShell className={classes.outer} header={{ height: 100 }}>
      <Header />
      <AppShell.Main className={classes.outer}>
        <img className={classes.heroImage1} src={WorkingEnvironmentImage} alt="Working Environment" />
        <Container>
          <div className={classes.inner}>
            <div className={classes.content}>
              <Title className={classes.title}>
                {copy.landingTitleLead}
                <br />
                <span className={classes.highlight}>{copy.landingTitleHighlight}</span>
              </Title>
              <Text size="lg" c="dimmed" mt="md">
                {copy.landingSubtitle}
              </Text>
              <Group mt={30}>
                <Button radius="xl" size="md" className={classes.control}>
                  {copy.getStarted}
                </Button>
                <Button variant="default" radius="xl" size="md" className={classes.control}>
                  {copy.sourceCode}
                </Button>
              </Group>
            </div>
            <img className={classes.heroImage2} src={DoctorImage} alt="Doctor" />
          </div>
        </Container>
        <Container>
          <div className={classes.inner}>
            <div className={classes.healthcareCopy}>
              <Title order={3} fw={500} c={theme.primaryColor} mb="lg">
                {copy.landingHealthcareEyebrow}
              </Title>
              <Title order={1} fw={500} mb="md">
                {copy.landingHealthcareTitle}
              </Title>
              <Text size="xl" c="gray">
                {copy.landingHealthcareBody}
              </Text>
            </div>
            <img className={classes.heroImage3} src={LabImage} alt="Laboratory" />
          </div>
        </Container>
        <Container>
          <div className={cx(classes.inner, classes.featureSection)}>
            <Stack align="flex-end">
              {features.map((feature, index) => (
                <Box key={`feature-${index}`} className={classes.featureBox}>
                  <Text className={classes.featureTitle}>{feature.title}</Text>
                  <Text className={classes.featureDescription}>{feature.description}</Text>
                </Box>
              ))}
            </Stack>
            <img className={classes.heroImage4} src={EngineeringImage} alt="Laboratory" />
          </div>
        </Container>
      </AppShell.Main>
      <Footer />
    </AppShell>
  );
}
