/**
 * Email service for Cravvr.
 *
 * All transactional and lifecycle email goes through the `resend-email`
 * Supabase Edge Function (which uses **Resend** + react-email templates).
 *
 * Templates live at supabase/functions/_shared/emails/<name>.tsx and are
 * registered by name in the edge function's TEMPLATES map. To call one,
 * pass its kebab-case name plus the props its component accepts.
 */

import { supabase } from '../lib/supabase'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SEND_EMAIL_FUNCTION = `${SUPABASE_URL}/functions/v1/resend-email`

/**
 * Send an email by template name.
 * @param {string} to        Recipient email address
 * @param {string} template  Template name (e.g. 'welcome', 'order-confirmation')
 * @param {object} data      Props for the template component
 * @param {string} [subject] Optional subject override (default comes from the template)
 */
const sendEmail = async (to, template, data, subject) => {
  try {
    const { data: { session } } = await supabase.auth.getSession()

    const response = await fetch(SEND_EMAIL_FUNCTION, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session?.access_token || ''}`,
      },
      body: JSON.stringify({ to, template, data, subject }),
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({}))
      throw new Error(error.error || 'Failed to send email')
    }

    return await response.json()
  } catch (error) {
    console.error('Email send error:', error)
    throw error
  }
}

export const sendPasswordResetEmail = (email, resetLink, userName = 'User') =>
  sendEmail(email, 'password-reset', { name: userName, resetLink })

export const sendWelcomeEmail = (email, userName) =>
  sendEmail(email, 'welcome', {
    name: userName,
    appLink: window.location.origin,
    helpLink: `${window.location.origin}/help`,
  })

export const sendOrderConfirmationEmail = (email, orderData) =>
  sendEmail(email, 'order-confirmation', {
    customerName: orderData.customerName,
    truckName: orderData.truckName,
    orderNumber: orderData.orderNumber,
    orderTime: orderData.orderTime,
    estimatedTime: orderData.estimatedTime,
    items: orderData.items.map((item) => ({
      quantity: item.quantity,
      name: item.name,
      price: parseFloat(item.price).toFixed(2),
    })),
    total: parseFloat(orderData.total).toFixed(2),
    trackOrderLink: `${window.location.origin}/order/${orderData.orderId}`,
  })

export const sendOrderStatusEmail = (email, statusData) =>
  sendEmail(email, 'order-status', {
    customerName: statusData.customerName,
    statusTitle: statusData.statusTitle,
    statusMessage: statusData.statusMessage,
    status: statusData.status,
    orderNumber: statusData.orderNumber,
    truckName: statusData.truckName,
    estimatedTime: statusData.estimatedTime || null,
    estimatedTimeLabel: statusData.estimatedTimeLabel || 'Estimated time',
    trackOrderLink: `${window.location.origin}/order/${statusData.orderId}`,
  })

export const sendTruckApprovedEmail = (email, truckData) =>
  sendEmail(email, 'truck-approved', {
    ownerName: truckData.ownerName,
    truckName: truckData.truckName,
    dashboardLink: `${window.location.origin}/owner`,
    ownerGuideLink: `${window.location.origin}/owner-guide`,
  })

/**
 * Notify a truck owner about an administrative action on their truck.
 * action: 'suspended' | 'deleted' | 'restored' | 'transferred' | 'received'
 */
export const sendAdminActionEmail = (email, { ownerName, truckName, action, reason }) =>
  sendEmail(email, 'admin-action-notification', {
    ownerName,
    truckName,
    action,
    reason: reason || null,
    dashboardLink: `${window.location.origin}/owner`,
  })

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
      statusMessage: "Your order is ready for pickup! Head to the truck when you're ready.",
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
