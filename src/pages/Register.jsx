import React, { useState } from 'react';
import {
    TextInput,
    PasswordInput,
    Anchor,
    Paper,
    Title,
    Text,
    Container,
    Button,
    Box
} from '@mantine/core';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notifications } from '@mantine/notifications';
import { FaUser, FaLock, FaEnvelope } from 'react-icons/fa';
import axios from 'axios';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            await register(
                formData.username,
                formData.email,
                formData.password,
                formData.displayName
            );
            notifications.show({
                title: 'Success',
                message: 'Registration successful!',
                color: 'green'
            });
            navigate('/');
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Registration failed. Try again.');
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
            background: 'radial-gradient(circle at center, #0f2e2a 0%, #0b141a 100%)',
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
                    Create Account
                </Title>
                <Text c="dimmed" size="sm" ta="center" mt={5}>
                    Already have an account?{' '}
                    <Anchor size="sm" component={Link} to="/login" c="green.4">
                        Login
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
                            label="Username"
                            placeholder="Your name"
                            required
                            name="username"
                            leftSection={<FaUser size={14} />}
                            value={formData.username}
                            onChange={handleChange}
                            styles={{ label: { color: '#C1C2C5' } }}
                        />
                        <TextInput
                            label="Your Name (Display Name)"
                            placeholder="Enter your name"
                            name="displayName"
                            mt="md"
                            value={formData.displayName}
                            onChange={handleChange}
                            styles={{ label: { color: '#C1C2C5' } }}
                        />
                        <TextInput
                            label="Email"
                            placeholder="you@example.com"
                            required
                            name="email"
                            mt="md"
                            leftSection={<FaEnvelope size={14} />}
                            value={formData.email}
                            onChange={handleChange}
                            styles={{ label: { color: '#C1C2C5' } }}
                        />
                        <PasswordInput
                            label="Password"
                            placeholder="Create a password"
                            required
                            name="password"
                            mt="md"
                            leftSection={<FaLock size={14} />}
                            value={formData.password}
                            onChange={handleChange}
                            styles={{ label: { color: '#C1C2C5' } }}
                        />
                        <PasswordInput
                            label="Confirm Password"
                            placeholder="Confirm your password"
                            required
                            name="confirmPassword"
                            mt="md"
                            leftSection={<FaLock size={14} />}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            styles={{ label: { color: '#C1C2C5' } }}
                        />

                        {error && (
                            <Text c="red" size="sm" mt="sm">
                                {error}
                            </Text>
                        )}

                        <Button fullWidth mt="xl" type="submit" loading={loading} color="green">
                            Register
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
}
