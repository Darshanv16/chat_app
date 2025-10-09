import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { countryCodes } from '../lib/countryCodes';
import { useTheme } from '../contexts/ThemeContext';

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

export default function PhoneInput({
  value,
  onChange,
  placeholder = 'Phone number',
  required = false,
  className = '',
}: PhoneInputProps) {
  const { themeConfig } = useTheme();
  const [countryCode, setCountryCode] = useState('+1');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = countryCodes.filter(
    (country) =>
      country.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
      country.code.includes(searchQuery)
  );

  const handlePhoneNumberChange = (num: string) => {
    setPhoneNumber(num);
    onChange(countryCode + num);
  };

  const handleCountryCodeChange = (code: string) => {
    setCountryCode(code);
    onChange(code + phoneNumber);
    setShowDropdown(false);
    setSearchQuery('');
  };

  const selectedCountry = countryCodes.find((c) => c.code === countryCode);

  return (
    <div className={`flex space-x-2 ${className}`}>
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowDropdown(!showDropdown)}
          className="h-full px-3 py-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition flex items-center space-x-2 min-w-[100px]"
        >
          <span className="text-lg">{selectedCountry?.flag}</span>
          <span className="text-sm font-medium">{countryCode}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>

        {showDropdown && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => {
                setShowDropdown(false);
                setSearchQuery('');
              }}
            />
            <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-hidden flex flex-col">
              <div className="p-2 border-b border-gray-200">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search country..."
                  className="w-full px-3 py-2 rounded border border-gray-300 text-sm focus:ring-2 focus:${themeConfig.ring} focus:border-transparent outline-none"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="overflow-y-auto">
                {filteredCountries.map((country) => (
                  <button
                    key={country.code}
                    type="button"
                    onClick={() => handleCountryCodeChange(country.code)}
                    className="w-full px-3 py-2 hover:bg-gray-50 flex items-center space-x-3 text-left transition"
                  >
                    <span className="text-lg">{country.flag}</span>
                    <span className="text-sm font-medium flex-1">{country.country}</span>
                    <span className="text-sm text-gray-600">{country.code}</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      <input
        type="tel"
        value={phoneNumber}
        onChange={(e) => handlePhoneNumberChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="flex-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:${themeConfig.ring} focus:border-transparent outline-none transition"
      />
    </div>
  );
}
