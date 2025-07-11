-- Reset onboarding status for testing
UPDATE profiles 
SET onboarding_completed = false 
WHERE email = 'mariatucker77@gmail.com';