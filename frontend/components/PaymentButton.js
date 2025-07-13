import React from 'react';

const PaymentButton = ({ amount, email, event }) => {
  const handlePayment = () => {
    const paymentHandler = window.PaystackPop.setup({
      key: 'pk_test_ac17d8f5f05d3e72734686d0d270f7d6bc0d0160',
      email: email,
      amount: amount * 100, // Paystack expects the amount in kobo
      currency: 'NGN',
      callback: function(response) {
        alert('Payment complete! Reference: ' + response.reference);
        // Handle successful payment
      },
      onClose: function() {
        alert('Payment window closed.');
      }
    });
    paymentHandler.openIframe();
  };

  return (
    <button onClick={handlePayment} className="bg-green-500 text-white px-4 py-2 rounded">
      Pay ${amount}
    </button>
  );
};

export default PaymentButton;