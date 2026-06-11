const axios = require('axios');

// Test script to verify teacher registration works correctly
async function testTeacherRegistration() {
    const baseURL = 'http://localhost:3000'; // Adjust if your server runs on a different port

    console.log('Testing teacher registration...');

    try {
        // Test data for a teacher registration
        const teacherData = {
            email: `test_teacher_${Date.now()}@example.com`,
            password: 'testpassword123',
            name: 'Test',
            family_name: 'Teacher',
            phone: '+972-50-1234567',
            city: 'Jerusalem',
            userType: 'LEARN_GIVER' // This should register as a teacher
        };

        console.log('Registering teacher with data:', teacherData);

        // Register the teacher
        const registerResponse = await axios.post(`${baseURL}/api/auth/register`, teacherData);

        if (registerResponse.data.success) {
            console.log('✅ Registration successful!');
            console.log('User data:', registerResponse.data.user);

            // Verify the user type is correct
            if (registerResponse.data.user.userType === 'LEARN_GIVER') {
                console.log('✅ User type is correct: LEARN_GIVER (teacher)');
            } else {
                console.log('❌ User type is incorrect:', registerResponse.data.user.userType);
                console.log('Expected: LEARN_GIVER, Got:', registerResponse.data.user.userType);
            }

            // Login as supervisor to check statistics
            console.log('\nTesting supervisor login and statistics...');
            const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
                email: 'supervisor@tachlit.com',
                password: 'admin123'
            });

            if (loginResponse.data.success) {
                console.log('✅ Supervisor login successful');

                // Get statistics
                const statsResponse = await axios.get(`${baseURL}/api/admin/stats`, {
                    headers: {
                        'Authorization': `Bearer ${loginResponse.data.token}`
                    }
                });

                if (statsResponse.data.success) {
                    console.log('✅ Statistics retrieved successfully');
                    console.log('Statistics:', statsResponse.data.stats);

                    if (statsResponse.data.stats.learnGivers > 0) {
                        console.log('✅ Teachers count is greater than 0:', statsResponse.data.stats.learnGivers);
                    } else {
                        console.log('❌ Teachers count is still 0');
                    }
                } else {
                    console.log('❌ Failed to get statistics:', statsResponse.data.message);
                }
            } else {
                console.log('❌ Supervisor login failed:', loginResponse.data.message);
            }

        } else {
            console.log('❌ Registration failed:', registerResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Test failed with error:', error.message);
        console.error('Full error:', error);
        if (error.response) {
            console.error('Response status:', error.response.status);
            console.error('Response data:', error.response.data);
        }
        if (error.code) {
            console.error('Error code:', error.code);
        }
    }
}

// Test student registration as well to ensure it still works
async function testStudentRegistration() {
    const baseURL = 'http://localhost:3000';

    console.log('\nTesting student registration...');

    try {
        const studentData = {
            email: `test_student_${Date.now()}@example.com`,
            password: 'testpassword123',
            name: 'Test',
            family_name: 'Student',
            phone: '+972-50-1234568',
            city: 'Tel Aviv',
            userType: 'LEARN_ASKER' // This should register as a student
        };

        console.log('Registering student with data:', studentData);

        const registerResponse = await axios.post(`${baseURL}/api/auth/register`, studentData);

        if (registerResponse.data.success) {
            console.log('✅ Student registration successful!');

            if (registerResponse.data.user.userType === 'LEARN_ASKER') {
                console.log('✅ Student user type is correct: LEARN_ASKER');
            } else {
                console.log('❌ Student user type is incorrect:', registerResponse.data.user.userType);
            }
        } else {
            console.log('❌ Student registration failed:', registerResponse.data.message);
        }

    } catch (error) {
        console.error('❌ Student test failed with error:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the tests
async function runTests() {
    console.log('=== Teacher Registration Fix Test ===\n');
    await testTeacherRegistration();
    await testStudentRegistration();
    console.log('\n=== Test Complete ===');
}

runTests();
