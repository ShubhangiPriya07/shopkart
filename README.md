# ShopKart — MERN E-Commerce Application

ShopKart is a full-stack e-commerce web application built using the MERN stack. It allows users to browse products, manage wishlists and shopping carts, make test payments, and track their orders.

## Features

- **User Authentication:** Customer registration, login, and logout.
- **Product Catalog:** Browse products and view product details.
- **Wishlist:** Add and remove products from a personal wishlist.
- **Shopping Cart:** Add products, update quantities, remove items, and calculate subtotals.
- **Checkout:** Enter shipping information with input validation.
- **Payment Integration:** Razorpay Test Mode payment integration with server-side signature verification.
- **Order Management:** View order history and individual order details.
- **Protected Routes:** Authentication middleware protects customer-specific operations.
- **Responsive UI:** CSS styling for the shopping experience across screen sizes.

## Tech Stack

**Frontend**
- React
- Vite
- React Router DOM
- Axios
- CSS

**Backend**
- Node.js
- Express.js
- MongoDB
- Mongoose
- JSON Web Tokens (JWT)
- bcrypt
- cookie-parser
- Razorpay SDK

## Project Structure

```text
shopkart/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middlewares/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── index.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.js
└── .gitignore
```

## Prerequisites

Install the following before running the project:

- [Node.js and npm](https://nodejs.org/)
- A MongoDB Atlas account or local MongoDB instance
- A Razorpay account for Test Mode API credentials
- Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/ShubhangiPriya07/shopkart.git
cd shopkart
```

### 2. Configure the backend

Create a `.env` file inside the `backend` directory with the following variables:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_random_secret
RAZORPAY_KEY_ID=your_razorpay_test_key_id
RAZORPAY_KEY_SECRET=your_razorpay_test_key_secret
```

Replace the placeholders with your own credentials. Do not commit your `.env` file or expose your API secrets.

### 3. Install backend dependencies

```bash
cd backend
npm install
```

### 4. Install frontend dependencies

Open a second terminal from the project root and run:

```bash
cd frontend
npm install
```

### 5. Start the backend

From the backend directory:

```bash
node index.js
```

The backend runs at:

`http://localhost:5000`

Ensure MongoDB is accessible and the environment variables are configured.

### 6. Start the frontend

From the frontend directory:

```bash
npm run dev
```

Open the URL printed by Vite, usually:

`http://localhost:5173`

Keep both the backend and frontend running while using the application.

## Payment Testing

ShopKart integrates Razorpay Test Mode for development and academic testing.

- Configure valid Razorpay Test Mode API credentials in `backend/.env`.
- Use the Razorpay test payment flow to test checkout.
- The backend verifies the payment signature before marking an order as paid.
- The cart is cleared after successful payment verification.

Test Mode is intended for testing and does not represent a live payment setup.

## Security

- Environment files and private credentials must not be committed to GitHub.
- Customer-specific operations require authentication.
- Payment signatures are verified on the backend.
- Configure your own MongoDB and Razorpay credentials before running the project.

## Author

**Shubhangi Priya**

GitHub: [ShubhangiPriya07](https://github.com/ShubhangiPriya07)
