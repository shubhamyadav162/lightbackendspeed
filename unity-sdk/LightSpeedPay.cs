using System;
using System.Collections;
using System.Collections.Generic;
using System.Text;
using System.Security.Cryptography;
using UnityEngine;
using UnityEngine.Networking;

namespace LightSpeedPay
{
    /// <summary>
    /// Payment request data structure
    /// </summary>
    [Serializable]
    public class PaymentRequest
    {
        public float amount;
        public string currency = "INR";
        public string customerEmail;
        public string customerPhone;
        public string customerName;
        public string paymentMethod; // UPI, CARD, NETBANKING, WALLET
        public string callbackUrl;
        public Dictionary<string, string> metadata;
    }

    /// <summary>
    /// Payment response data structure
    /// </summary>
    [Serializable]
    public class PaymentResponse
    {
        public string txnId;
        public string checkoutUrl;
        public string status; // PENDING, SUCCESS, FAILED, CANCELLED
        public string message;
    }

    /// <summary>
    /// Transaction status data structure
    /// </summary>
    [Serializable]
    public class TransactionStatus
    {
        public string txnId;
        public string merchantId;
        public float amount;
        public string currency;
        public string status; // PENDING, SUCCESS, FAILED, CANCELLED
        public string customerEmail;
        public string customerPhone;
        public string customerName;
        public string paymentMethod;
        public string pgTxnId;
        public string failureReason;
        public int attempts;
        public string createdAt;
        public string updatedAt;
    }

    /// <summary>
    /// Main LightSpeedPay SDK class for Unity integration
    /// </summary>
    public class LightSpeedPaySDK : MonoBehaviour
    {
        private static LightSpeedPaySDK _instance;
        private string _apiKey;
        private string _apiBaseUrl;
        private bool _sandboxMode;

        /// <summary>
        /// Singleton instance
        /// </summary>
        public static LightSpeedPaySDK Instance
        {
            get
            {
                if (_instance == null)
                {
                    GameObject go = new GameObject("LightSpeedPaySDK");
                    _instance = go.AddComponent<LightSpeedPaySDK>();
                    DontDestroyOnLoad(go);
                }
                return _instance;
            }
        }

        /// <summary>
        /// Initialize the SDK
        /// </summary>
        /// <param name="apiKey">Your merchant API key from LightSpeedPay dashboard</param>
        /// <param name="sandboxMode">Whether to use sandbox mode (default: false)</param>
        /// <param name="customBaseUrl">Optional custom API base URL</param>
        public void Initialize(string apiKey, bool sandboxMode = false, string customBaseUrl = null)
        {
            _apiKey = apiKey;
            _sandboxMode = sandboxMode;
            _apiBaseUrl = customBaseUrl ?? 
                (sandboxMode ? "https://sandbox-api.lightspeedpay.com" : "https://api.lightspeedpay.com");
            
            Debug.Log($"LightSpeedPay SDK initialized with API key: {apiKey}, Sandbox mode: {sandboxMode}");
        }

        /// <summary>
        /// Set sandbox mode (useful for changing mode after initialization)
        /// </summary>
        /// <param name="enabled">Whether to enable sandbox mode</param>
        public void SetSandboxMode(bool enabled)
        {
            _sandboxMode = enabled;
            _apiBaseUrl = enabled 
                ? "https://sandbox-api.lightspeedpay.com" 
                : "https://api.lightspeedpay.com";
            
            Debug.Log($"LightSpeedPay SDK sandbox mode set to: {enabled}");
        }

        /// <summary>
        /// Generate HMAC signature for authentication
        /// </summary>
        /// <param name="timestamp">Current timestamp</param>
        /// <returns>HMAC signature</returns>
        private string GenerateSignature(long timestamp)
        {
            // This is a simplified example - in production, use proper HMAC-SHA256
            string data = timestamp.ToString();
            byte[] keyBytes = Encoding.UTF8.GetBytes(_apiKey);
            byte[] messageBytes = Encoding.UTF8.GetBytes(data);

            using (HMACSHA256 hmac = new HMACSHA256(keyBytes))
            {
                byte[] hashBytes = hmac.ComputeHash(messageBytes);
                return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
            }
        }

        /// <summary>
        /// Initiate a payment
        /// </summary>
        /// <param name="request">Payment request data</param>
        /// <param name="callback">Callback function to receive the response</param>
        public void InitiatePayment(PaymentRequest request, Action<PaymentResponse> callback)
        {
            // Implementation would be here
            // This is a mock implementation for example purposes
            PaymentResponse response = new PaymentResponse
            {
                txnId = "mock_txn_" + UnityEngine.Random.Range(1000, 9999),
                checkoutUrl = "https://checkout.lightspeedpay.com/sample",
                status = "PENDING"
            };
            
            callback?.Invoke(response);
        }

        /// <summary>
        /// Check transaction status
        /// </summary>
        /// <param name="txnId">Transaction ID to check</param>
        /// <param name="callback">Callback function to receive the status</param>
        public void CheckTransactionStatus(string txnId, Action<TransactionStatus> callback)
        {
            // Implementation would be here
            // This is a mock implementation for example purposes
            TransactionStatus status = new TransactionStatus
            {
                txnId = txnId,
                status = UnityEngine.Random.Range(0, 2) == 0 ? "PENDING" : "SUCCESS"
            };
            
            callback?.Invoke(status);
        }

        /// <summary>
        /// Open the checkout URL in the default browser
        /// </summary>
        /// <param name="checkoutUrl">Checkout URL from payment response</param>
        public void OpenCheckout(string checkoutUrl)
        {
            Application.OpenURL(checkoutUrl);
        }
    }
} 