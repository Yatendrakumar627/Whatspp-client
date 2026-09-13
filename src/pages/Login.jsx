import React, { useState } from 'react';
import {
    TextInput,
    PasswordInput,
    Checkbox,
    Anchor,
    Paper,
    Title,
    Text,
    Container,
    Group,
    Button,
    Center,
    Box,
    Divider
} from '@mantine/core';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaLock, FaEnvelope } from 'react-icons/fa';
import { IoQrCodeOutline } from "react-icons/io5";
import QRScanner from '../components/QRScanner';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [qrScannerOpened, setQrScannerOpened] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'radial-gradient(circle at center, #0f2e2a 0%, #0b141a 100%)', // Premium dark green to black
            padding: '20px'
        }}>
            <Container size="xs" my={{ base: 20, md: 40 }} style={{ width: '100%', maxWidth: '420px' }}>
                <Title
                    align="center"
                    style={{
                        fontFamily: 'Outfit, sans-serif',
                        fontWeight: 800,
                        fontSize: '36px',
                        letterSpacing: '-1px',
                        background: 'linear-gradient(135deg, #25d366 0%, #00a884 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        marginBottom: '10px'
                    }}
                >
                    Welcome back
                </Title>
                <Text c="dimmed" size="sm" ta="center" mt={5}>
                    Do not have an account yet?{' '}
                    <Anchor size="sm" component={Link} to="/register" c="green.4">
                        Create account
                    </Anchor>
                </Text>

                <Paper
                    withBorder
                    shadow="xl"
                    p={30}
                    mt={30}
                    radius="md"
                    className="glass-panel"
                >
                    <form onSubmit={handleSubmit}>
                        <TextInput
                            label="Email"
                            placeholder="you@example.com"
                            required
                            leftSection={<FaEnvelope size={14} />}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            styles={{ label: { color: '#C1C2C5' } }}
                        />
                        <PasswordInput
                            label="Password"
                            placeholder="Your password"
                            required
                            mt="md"
                            leftSection={<FaLock size={14} />}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            styles={{ label: { color: '#C1C2C5' } }}
                        />

                        {error && (
                            <Text c="red" size="sm" mt="sm">
                                {error}
                            </Text>
                        )}

                        {/* <Group justify="space-between" mt="lg">
              <Checkbox label="Remember me" styles={{ label: { color: '#C1C2C5' } }} />
              <Anchor component="button" size="sm" c="dimmed">
                Forgot password?
              </Anchor>
            </Group> */}

                        <Button fullWidth mt="xl" type="submit" loading={loading} color="green">
                            Sign in
                        </Button>

                        <Divider label="OR" labelPosition="center" my="lg" />

                        <Button
                            fullWidth
                            variant="outline"
                            color="gray"
                            leftSection={<IoQrCodeOutline size={20} />}
                            onClick={() => setQrScannerOpened(true)}
                            styles={{ root: { borderColor: '#202c33', color: '#e9edef' } }}
                        >
                            Log in with QR Code
                        </Button>
                    </form>
                </Paper>
            </Container>
            <QRScanner opened={qrScannerOpened} onClose={() => setQrScannerOpened(false)} mode="login" />
        </Box>
    );
}
