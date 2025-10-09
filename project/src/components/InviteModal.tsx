import { useState } from 'react';
import { X, Share2, Copy, Check, Phone, Mail, QrCode } from 'lucide-react';
import { supabase, type Profile } from '../lib/supabase';
import PhoneInput from './PhoneInput';
import { useTheme } from '../contexts/ThemeContext';

type InviteModalProps = {
  currentUser: Profile;
  onClose: () => void;
};

export default function InviteModal({ currentUser, onClose }: InviteModalProps) {
  const { themeConfig } = useTheme();
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
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <h2 className="text-lg font-semibold text-gray-800">Invite</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <h3 className="font-medium text-gray-800 mb-2 text-sm">Quick Share</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleCopyLink}
                className={`flex-1 ${themeConfig.primary} text-white px-3 py-2 rounded-lg font-medium text-sm ${themeConfig.primaryHover} transition flex items-center justify-center space-x-1.5`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy</span>
                  </>
                )}
              </button>
              <button
                onClick={handleShare}
                className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition flex items-center justify-center space-x-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </button>
              <button
                onClick={() => setShowQR(!showQR)}
                className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition"
                title="QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>
            {showQR && (
              <div className="mt-3 flex justify-center">
                <div className="bg-white p-3 rounded-lg border border-gray-200">
                  <img src={generateQRCode()} alt="QR Code" className="w-32 h-32" />
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 pt-5">
            <h3 className="font-medium text-gray-800 mb-2 text-sm">Send Invite</h3>

            <div className="flex space-x-2 mb-3">
              <button
                onClick={() => setInviteMethod('phone')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition flex items-center justify-center space-x-1.5 ${
                  inviteMethod === 'phone'
                    ? `${themeConfig.primary} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Phone className="w-3.5 h-3.5" />
                <span>Phone</span>
              </button>
              <button
                onClick={() => setInviteMethod('email')}
                className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm transition flex items-center justify-center space-x-1.5 ${
                  inviteMethod === 'email'
                    ? `${themeConfig.primary} text-white`
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Email</span>
              </button>
            </div>

            {inviteMethod === 'phone' ? (
              <div className="mb-3">
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  placeholder="1234567890"
                />
              </div>
            ) : (
              <div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:${themeConfig.ring} focus:border-transparent outline-none mb-3"
                />
              </div>
            )}

            <button
              onClick={handleSendInvite}
              disabled={loading || success}
              className={`w-full ${themeConfig.primary} text-white py-2.5 rounded-lg font-medium text-sm ${themeConfig.primaryHover} transition disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {success ? 'Sent!' : loading ? 'Sending...' : 'Send'}
            </button>
          </div>

          <div className={`${themeConfig.primaryLight} p-3 rounded-lg border ${themeConfig.text} border-opacity-20`}>
            <p className="text-xs text-gray-700">
              <strong>Invite Code:</strong> <span className="font-mono">{currentUser.invite_code}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}