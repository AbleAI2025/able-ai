# Firebase Phone Authentication Setup Guide

## 🔧 **Firebase Console Configuration**

### 1. Enable Phone Authentication
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `ableai-mvp`
3. Navigate to **Authentication** → **Sign-in method**
4. Enable **Phone** provider
5. Add your domain to **Authorized domains**:
   - `localhost` (for development)
   - `able-ai-mvp-able-ai-team.vercel.app` (for production)
   - Your custom domain if you have one

### 2. Configure reCAPTCHA
1. In the same **Sign-in method** page
2. Under **Phone** provider settings
3. Configure reCAPTCHA settings:
   - **reCAPTCHA type**: Invisible (recommended for better UX)
   - **reCAPTCHA version**: v2

### 3. Test Phone Numbers (Development)
1. In **Authentication** → **Sign-in method** → **Phone**
2. Add test phone numbers in **Phone numbers for testing**:
   - Format: `+44 7XXX XXX XXX` (UK)
   - Format: `+1 XXX XXX XXXX` (US)
   - Verification code: `123456` (for testing)

## 📱 **Implementation Notes**

### Phone Number Format
- Always include country code (e.g., `+44` for UK, `+1` for US)
- Remove spaces and special characters before sending to Firebase
- Validate format before sending verification code

### reCAPTCHA Configuration
- The component automatically handles reCAPTCHA setup
- Uses invisible reCAPTCHA for better user experience
- Falls back to visible reCAPTCHA if needed

### Error Handling
- `auth/invalid-phone-number`: Invalid phone number format
- `auth/too-many-requests`: Rate limiting
- `auth/quota-exceeded`: SMS quota exceeded
- `auth/invalid-verification-code`: Wrong verification code
- `auth/code-expired`: Verification code expired

## 🚀 **Usage**

### 1. Import the Components
```tsx
import RegisterViewWithPhoneVerification from '@/app/components/signin/RegisterViewWithPhoneVerification';
import PhoneVerification from '@/app/components/auth/PhoneVerification';
import PhoneNumberInput from '@/app/components/auth/PhoneNumberInput';
```

### 2. Replace Existing RegisterView
```tsx
// In your sign-in page
<RegisterViewWithPhoneVerification
  onToggleRegister={() => setShowSignIn(true)}
  onError={setError}
/>
```

### 3. Custom Phone Input
```tsx
<PhoneNumberInput
  value={phoneNumber}
  onChange={setPhoneNumber}
  onError={setPhoneError}
  disabled={loading}
/>
```

## 🔒 **Security Considerations**

### 1. Rate Limiting
- Firebase automatically rate limits phone verification
- Consider additional rate limiting on your backend
- Monitor for abuse patterns

### 2. Phone Number Validation
- Validate phone numbers on both client and server
- Check for valid country codes
- Prevent fake phone numbers

### 3. Verification Code Security
- Codes expire after 5 minutes
- Maximum 5 attempts per code
- Codes are single-use only

## 📊 **Monitoring & Analytics**

### 1. Firebase Analytics
- Track verification success/failure rates
- Monitor conversion funnel
- Identify common failure points

### 2. Custom Metrics
- Track phone verification completion rate
- Monitor time to verification
- Track drop-off points in flow

## 🧪 **Testing**

### 1. Test Phone Numbers
- Use Firebase test phone numbers for development
- Test with real phone numbers in staging
- Verify international number support

### 2. Error Scenarios
- Test invalid phone numbers
- Test expired verification codes
- Test rate limiting
- Test network failures

## 💰 **Cost Considerations**

### 1. Firebase Pricing
- **Free tier**: 10,000 verifications/month
- **Paid tier**: $0.01 per verification after free tier
- Monitor usage in Firebase Console

### 2. Optimization
- Implement proper error handling to reduce failed attempts
- Use test phone numbers in development
- Monitor for abuse patterns

## 🚨 **Troubleshooting**

### Common Issues
1. **reCAPTCHA not loading**: Check domain authorization
2. **Invalid phone number**: Verify country code format
3. **Verification code not received**: Check spam folder, try resend
4. **Rate limiting**: Wait before retrying, check Firebase quotas

### Debug Mode
```tsx
// Enable debug logging
import { connectAuthEmulator } from 'firebase/auth';

if (process.env.NODE_ENV === 'development') {
  connectAuthEmulator(authClient, 'http://localhost:9099');
}
```
