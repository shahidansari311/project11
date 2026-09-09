### 1. 2FA Login Flow
**Step 1: Send Password**
* `POST /api/v1/auth/admin/login-step1`
* Body: `{ "phone": "8472921035", "password": "password123" }`
* Response: Success message (OTP sent via SMS).

**Step 2: Verify OTP & Login**
* `POST /api/v1/auth/admin/login-step2`
* Body: `{ "phone": "8472921035", "otp": "123456" }`
* Response: Returns `token` and `refreshToken`.

---

### Admin Test Credentials
Use the following credentials to test the login and password reset flows:

**Admin 1:**
- **Mobile Number:** `8472921035`
- **Default Password:** `password123`
- **Security Question:** `What is the name of your first pet?`
- **Security Answer:** `dog`

**Admin 2:**
- **Mobile Number:** `9786123456`
- **Default Password:** `password123`
- **Security Question:** `What city were you born in?`
- **Security Answer:** `mumbai`

---

### 2. Password Reset Flow
**Step 1: Get Security Question**
* `GET /api/v1/auth/admin/reset-password/question?phone=8472921035`
* Response: `{ "question": "What is the name of your first pet?" }`

**Step 2: Submit Security Answer**
* `POST /api/v1/auth/admin/reset-password/verify-answer`
* Body: `{ "phone": "8472921035", "answer": "dog" }`
* Response: Returns a temporary `resetToken`.

**Step 3: Submit New Password**
* `POST /api/v1/auth/admin/reset-password/confirm`
* Body: `{ "phone": "8472921035", "resetToken": "...", "newPassword": "new_password" }`
* Response: Success message (Password updated).

---

### 3. Investment Refund Process
When an admin processes a refund for an investment that is in the `REFUND_REQUESTED` state, the frontend needs to upload a proof document and pass the URL to the backend.

**Step 1: Upload Document**
* Admin selects a PDF/Image of the bank transfer receipt.
* Frontend uploads it to S3/storage and gets the URL (`refundProofUrl`).

**Step 2: Submit Refund**
* `POST /api/v1/admin/investments/:id/refund`
* Body: `{ "refundProofUrl": "https://url-to-s3-document.pdf" }`
* Response: Success message (Status changed to `REFUNDED` and units released).
