/**
 * SendGrid Email Service for Cravvr
 *
 * This service handles all email communications through SendGrid using
 * Supabase Edge Functions.
 *
 * Before using:
 * 1. Deploy the send-email Edge Function to Supabase
 * 2. Set environment variables in Supabase (see SENDGRID_SETUP_GUIDE.md)
 * 3. Create email templates in SendGrid dashboard
 * 4. Update TEMPLATES object below with your SendGrid template IDs
 */

import { supabase } from '../lib/supabase'

// SendGrid Template IDs - UPDATE THESE WITH YOUR TEMPLATE IDS FROM SENDGRID
const TEMPLATES = {
  PASSWORD_RESET: 'd-xxxxxxxxxxxxxxxx', // Replace with your password reset template ID
  WELCOME: 'd-xxxxxxxxxxxxxxxx',        // Replace with your welcome email template ID
  ORDER_CONFIRMATION: 'd-xxxxxxxxxxxxxxxx', // Replace with your order confirmation template ID
  ORDER_STATUS: 'd-xxxxxxxxxxxxxxxx',   // Replace with your order status template ID
  TRUCK_APPROVED: 'd-xxxxxxxxxxxxxxxx', // Replace with your truck approved template ID
}

// Supabase Edge Function URL
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SEND_EMAIL_FUNCTION = `${SUPABASE_URL}/functions/v1/send-email`

/**
 * Base function to send emails through SendGrid
 * @private
 */
const sendEmail = async (to, templateId, dynamicData) => {
  try {
    // Get current session for authorization
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(SEND_EMAIL_FUNCTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({
        to,
        templateId,
        dynamicData: {
          ...dynamicData,
          year: new Date().getFullYear(), // Auto-add current year to all emails
        },
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to send email')
    }

    return await response.json()
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

/**
 * Send password reset email
 * @param {string} email - Recipient email address
 * @param {string} resetLink - Password reset URL with token
 * @param {string} userName - User's name
 */
export const sendPasswordResetEmail = async (email, resetLink, userName = 'User') => {
  return sendEmail(email, TEMPLATES.PASSWORD_RESET, {
    name: userName,
    resetLink,
  })
}

/**
 * Send welcome email to new users
 * @param {string} email - New user's email address
 * @param {string} userName - User's name
 */
export const sendWelcomeEmail = async (email, userName) => {
  return sendEmail(email, TEMPLATES.WELCOME, {
    name: userName,
    appLink: window.location.origin,
    helpLink: `${window.location.origin}/help`,
  })
}

/**
 * Send order confirmation email
 * @param {string} email - Customer email address
 * @param {Object} orderData - Order details
 * @param {string} orderData.customerName - Customer's name
 * @param {string} orderData.truckName - Food truck name
 * @param {string} orderData.orderNumber - Order ID or number
 * @param {string} orderData.orderTime - Time order was placed
 * @param {string} orderData.estimatedTime - Estimated pickup time
 * @param {Array} orderData.items - Array of order items [{quantity, name, price}]
 * @param {string} orderData.total - Total price
 * @param {string} orderData.orderId - Full order ID for tracking link
 */
export const sendOrderConfirmationEmail = async (email, orderData) => {
  return sendEmail(email, TEMPLATES.ORDER_CONFIRMATION, {
    customerName: orderData.customerName,
    truckName: orderData.truckName,
    orderNumber: orderData.orderNumber,
    orderTime: orderData.orderTime,
    estimatedTime: orderData.estimatedTime,
    items: orderData.items.map(item => ({
      quantity: item.quantity,
      name: item.name,
      price: parseFloat(item.price).toFixed(2),
    })),
    total: parseFloat(orderData.total).toFixed(2),
    trackOrderLink: `${window.location.origin}/orders/${orderData.orderId}`,
  })
}

/**
 * Send order status update email
 * @param {string} email - Customer email address
 * @param {Object} statusData - Order status details
 * @param {string} statusData.customerName - Customer's name
 * @param {string} statusData.statusTitle - Email title (e.g., "Your Order is Ready!")
 * @param {string} statusData.statusMessage - Status message
 * @param {string} statusData.status - Status label (e.g., "Ready for Pickup")
 * @param {string} statusData.orderNumber - Order ID or number
 * @param {string} statusData.truckName - Food truck name
 * @param {string} statusData.estimatedTime - Optional estimated time
 * @param {string} statusData.estimatedTimeLabel - Optional time label
 * @param {string} statusData.orderId - Full order ID for tracking link
 */
export const sendOrderStatusEmail = async (email, statusData) => {
  return sendEmail(email, TEMPLATES.ORDER_STATUS, {
    customerName: statusData.customerName,
    statusTitle: statusData.statusTitle,
    statusMessage: statusData.statusMessage,
    status: statusData.status,
    orderNumber: statusData.orderNumber,
    truckName: statusData.truckName,
    estimatedTime: statusData.estimatedTime || null,
    estimatedTimeLabel: statusData.estimatedTimeLabel || 'Estimated Time',
    trackOrderLink: `${window.location.origin}/orders/${statusData.orderId}`,
  })
}

/**
 * Send truck approval notification email
 * @param {string} email - Owner email address
 * @param {Object} truckData - Truck approval details
 * @param {string} truckData.ownerName - Owner's name
 * @param {string} truckData.truckName - Food truck name
 */
export const sendTruckApprovedEmail = async (email, truckData) => {
  return sendEmail(email, TEMPLATES.TRUCK_APPROVED, {
    ownerName: truckData.ownerName,
    truckName: truckData.truckName,
    dashboardLink: `${window.location.origin}/dashboard`,
    ownerGuideLink: `${window.location.origin}/owner-guide`,
  })
}

// Helper functions for common email scenarios

/**
 * Get status email data for different order statuses
 * @param {string} status - Order status from database
 */
export const getStatusEmailData = (status) => {
  const statusConfig = {
    confirmed: {
      statusTitle: 'Order Confirmed!',
      statusMessage: 'Your order has been confirmed and is being prepared.',
      status: 'Confirmed',
    },
    preparing: {
      statusTitle: 'Order in Progress',
      statusMessage: 'Your order is currently being prepared by the truck.',
      status: 'Preparing',
    },
    ready: {
      statusTitle: 'Your Order is Ready!',
      statusMessage: 'Your order is ready for pickup! Head to the truck when you\'re ready.',
      status: 'Ready for Pickup',
      estimatedTimeLabel: 'Ready',
      estimatedTime: 'Now',
    },
    completed: {
      statusTitle: 'Order Completed',
      statusMessage: 'Thank you for your order! We hope you enjoyed your meal.',
      status: 'Completed',
    },
    cancelled: {
      statusTitle: 'Order Cancelled',
      statusMessage: 'Your order has been cancelled. If this was a mistake, please contact support.',
      status: 'Cancelled',
    },
  }

  return statusConfig[status] || statusConfig.confirmed
}

// Export template IDs for reference
export { TEMPLATES }
