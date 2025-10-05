import { useState } from 'react';
import { X, Share2, Copy, Check, Phone, Mail, QrCode } from 'lucide-react';
import { supabase, type Profile } from '../lib/supabase';

type InviteModalProps = {
  currentUser: Profile;
  onClose: () => void;
};

export default function InviteModal({ currentUser, onClose }: InviteModalProps) {
  const [inviteMethod, setInviteMethod] = useState<'phone' | 'email'>('phone');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showQR, setShowQR] = useState(false);

  const inviteLink = `${window.location.origin}?invite=${currentUser.invite_code}`;

  const handleSendInvite = async () => {
    if (inviteMethod === 'phone' && !phoneNumber) return;
    if (inviteMethod === 'email' && !email) return;

    setLoading(true);
    try {
      await supabase.from('invites').insert({
        inviter_id: currentUser.id,
        phone_number: inviteMethod === 'phone' ? phoneNumber : null,
        email: inviteMethod === 'email' ? email : null,
        status: 'pending',
      });

      setSuccess(true);
      setTimeout(() => {
        setPhoneNumber('');
        setEmail('');
        setSuccess(false);
      }, 2000);
    } catch (error) {
      console.error('Error sending invite:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (error) {
      console.error('Error copying link:', error);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Chat App',
          text: `Connect with me on our chat app! Use my invite code: ${currentUser.invite_code}`,
          url: inviteLink,
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      handleCopyLink();
    }
  };

  const generateQRCode = () => {
    const qrData = encodeURIComponent(inviteLink);
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${qrData}`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-800">Invite Contacts</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Share Your Invite Link</h3>
            <div className="bg-gray-50 p-3 rounded-lg border border-gray-200 mb-3">
              <p className="text-sm text-gray-600 break-all">{inviteLink}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyLink}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center space-x-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center space-x-2"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>
          </div>

          <div>
            <button
              onClick={() => setShowQR(!showQR)}
              className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition flex items-center justify-center space-x-2"
            >
              <QrCode className="w-4 h-4" />
              <span>{showQR ? 'Hide' : 'Show'} QR Code</span>
            </button>
            {showQR && (
              <div className="mt-4 flex justify-center">
                <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
                  <img src={generateQRCode()} alt="QR Code" className="w-48 h-48" />
                  <p className="text-xs text-gray-500 text-center mt-2">
                    Scan to connect
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-6">
            <h3 className="font-medium text-gray-800 mb-3">Send Direct Invite</h3>

            <div className="flex space-x-2 mb-4">
              <button
                onClick={() => setInviteMethod('phone')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center space-x-2 ${
                  inviteMethod === 'phone'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Phone className="w-4 h-4" />
                <span>Phone</span>
              </button>
              <button
                onClick={() => setInviteMethod('email')}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center space-x-2 ${
                  inviteMethod === 'email'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </button>
            </div>

            {inviteMethod === 'phone' ? (
              <div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1234567890"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-3"
                />
              </div>
            ) : (
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-3"
                />
              </div>
            )}

            <button
              onClick={handleSendInvite}
              disabled={loading || success}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {success ? 'Invite Sent!' : loading ? 'Sending...' : 'Send Invite'}
            </button>
            <p className="text-xs text-gray-500 mt-2 text-center">
              When they sign up with this {inviteMethod}, you'll be automatically connected
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong>Your Invite Code:</strong> {currentUser.invite_code}
            </p>
            <p className="text-xs text-blue-600 mt-1">
              Share this code with friends to connect instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
