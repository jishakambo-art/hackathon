// Configuration
const SUPABASE_URL = 'https://ykkjvvntrhujzdzthxfb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlra2p2dm50cmh1anpkenRoeGZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc3NTExNDAsImV4cCI6MjA1MzMyNzE0MH0.sb_publishable_0rdUjYIQwTPtnWkMxOTZ4g_iXMWC_id';
const API_URL = 'https://hackathon-production-f662.up.railway.app';
const WEB_APP_URL = 'https://custompodcast.vercel.app';

// State
let currentUser = null;
let accessToken = null;

// Simple Supabase auth implementation
class SupabaseAuth {
  constructor(url, key) {
    this.url = url;
    this.key = key;
  }

  async signInWithOAuth(provider) {
    // Open OAuth URL in default browser
    const authUrl = `${this.url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent('http://localhost:54321/auth/callback')}`;
    await window.electronAPI.openExternal(authUrl);

    // For now, we'll need the user to manually paste their token
    // In a production app, we'd set up a local server to catch the OAuth callback
    return { error: null };
  }
}

const supabase = new SupabaseAuth(SUPABASE_URL, SUPABASE_ANON_KEY);

// DOM Elements
const authSection = document.getElementById('auth-section');
const notebooklmSection = document.getElementById('notebooklm-section');
const completeSection = document.getElementById('complete-section');

const signInBtn = document.getElementById('sign-in-btn');
const connectNotebookLMBtn = document.getElementById('connect-notebooklm-btn');
const openWebAppBtn = document.getElementById('open-web-app-btn');
const closeAppBtn = document.getElementById('close-app-btn');

const authStatus = document.getElementById('auth-status');
const notebooklmStatus = document.getElementById('notebooklm-status');

// Helper functions
function showStatus(element, message, type) {
  element.textContent = message;
  element.className = `status ${type}`;
}

function hideStatus(element) {
  element.className = 'status hidden';
}

function setButtonLoading(button, loading, loadingText) {
  if (loading) {
    button.disabled = true;
    button.dataset.originalText = button.innerHTML;
    button.innerHTML = `<span class="spinner"></span> ${loadingText}`;
  } else {
    button.disabled = false;
    if (button.dataset.originalText) {
      button.innerHTML = button.dataset.originalText;
    }
  }
}

// Event Handlers
signInBtn.addEventListener('click', async () => {
  try {
    setButtonLoading(signInBtn, true, 'Opening browser...');
    showStatus(authStatus, 'Opening browser for Google Sign In...', 'loading');

    // Open web app desktop setup page for authentication
    await window.electronAPI.openExternal(`${WEB_APP_URL}/desktop-setup`);

    // Show instructions to get token
    showStatus(authStatus, 'After signing in, copy your token from the web app and paste it below:', 'loading');

    // Show token input UI
    const tokenInput = document.createElement('div');
    tokenInput.style.marginTop = '16px';
    tokenInput.innerHTML = `
      <input type="text" id="token-input" placeholder="Paste your access token here"
        style="width: 100%; padding: 12px; border: 2px solid #e5e7eb; border-radius: 8px; font-size: 14px; margin-bottom: 8px;">
      <button id="verify-token-btn" class="btn btn-primary" style="width: 100%;">
        <span class="btn-icon">✓</span>
        Verify Token
      </button>
    `;

    authStatus.parentElement.appendChild(tokenInput);

    document.getElementById('verify-token-btn').addEventListener('click', async () => {
      const token = document.getElementById('token-input').value.trim();

      if (!token) {
        showStatus(authStatus, 'Please paste your token', 'error');
        return;
      }

      try {
        setButtonLoading(document.getElementById('verify-token-btn'), true, 'Verifying...');

        // Verify token with backend
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Invalid token');
        }

        const userData = await response.json();

        currentUser = { id: userData.user_id };
        accessToken = token;

        // Remove token input
        tokenInput.remove();

        showStatus(authStatus, `✓ Signed in successfully!`, 'success');
        setButtonLoading(signInBtn, false);

        // Show NotebookLM section
        setTimeout(() => {
          authSection.classList.add('hidden');
          notebooklmSection.classList.remove('hidden');
        }, 1500);

      } catch (error) {
        showStatus(authStatus, `Error: ${error.message}`, 'error');
        setButtonLoading(document.getElementById('verify-token-btn'), false);
      }
    });

    setButtonLoading(signInBtn, false);

  } catch (error) {
    console.error('Sign in error:', error);
    showStatus(authStatus, `Error: ${error.message}`, 'error');
    setButtonLoading(signInBtn, false);
  }
});

connectNotebookLMBtn.addEventListener('click', async () => {
  if (!currentUser || !accessToken) {
    showStatus(notebooklmStatus, 'Please sign in first', 'error');
    return;
  }

  try {
    setButtonLoading(connectNotebookLMBtn, true, 'Opening browser...');
    showStatus(notebooklmStatus, 'A browser window will open. Please sign in to NotebookLM with your Google account...', 'loading');

    // Step 1: Authenticate with NotebookLM
    const authResult = await window.electronAPI.authenticateNotebookLM(currentUser.id);

    if (!authResult.success) {
      throw new Error(authResult.message);
    }

    showStatus(notebooklmStatus, 'Uploading credentials to server...', 'loading');

    // Step 2: Upload credentials to server
    const uploadResult = await window.electronAPI.uploadCredentials({
      userId: currentUser.id,
      token: accessToken,
      apiUrl: API_URL,
    });

    if (!uploadResult.success) {
      throw new Error(uploadResult.message);
    }

    showStatus(notebooklmStatus, '✓ Successfully connected to NotebookLM!', 'success');
    setButtonLoading(connectNotebookLMBtn, false);

    // Show complete section
    setTimeout(() => {
      notebooklmSection.classList.add('hidden');
      completeSection.classList.remove('hidden');
    }, 2000);

  } catch (error) {
    console.error('NotebookLM connection error:', error);
    showStatus(notebooklmStatus, `Error: ${error.message}`, 'error');
    setButtonLoading(connectNotebookLMBtn, false);
  }
});

openWebAppBtn.addEventListener('click', async () => {
  await window.electronAPI.openExternal(WEB_APP_URL);
});

closeAppBtn.addEventListener('click', () => {
  window.close();
});

// Initialize
console.log('DailyBrief Setup app initialized');
