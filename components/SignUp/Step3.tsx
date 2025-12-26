"use client";

type FormDataType = {
  billingCountry: string;
  billingAddressLine1: string;
  billingAddressLine2?: string;
  billingCity: string;
  billingPostcode: string;
};

type HandleInputChange = (key: string, value: string) => void;

type ErrorsType = {
  billingCountry?: string;
  billingAddressLine1?: string;
  billingCity?: string;
  billingPostcode?: string;
};

export default function Step3({
  formData,
  handleInputChange,
  errors
}: {
  formData: FormDataType;
  handleInputChange: HandleInputChange;
  errors: ErrorsType;
}) {
  const countries = [
    // Europe
    "United Kingdom",
    "Germany",
    "France",
    "Italy",
    "Spain",
    "United States",
    "Canada",
    "Mexico",
    "China",
    "Japan",
    "India",
    "Bangladesh",
    "South Korea",
    "Indonesia",
  ];

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-6 border-b border-[#E3E3E3] text-[#0E0E0E] pb-6">
        Billing Address
      </h2>
      <div className="space-y-4">
        <div>
          <label
            htmlFor="billingCountry"
            className="text-lg font-semibold text-[#0E0E0E] block mb-2"
          >
            Country
          </label>
          <select
            id="billingCountry"
            value={formData.billingCountry}
            onChange={(e) =>
              handleInputChange("billingCountry", e.target.value)
            }
            className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
            aria-label="Country"
          >
            <option value="">Select Country</option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
          {errors.billingCountry && (
            <p className="text-red-500 text-sm mt-1">{errors.billingCountry}</p>
          )}
        </div>
        <div>
          <label
            htmlFor="billingAddressLine1"
            className="text-lg font-semibold text-[#0E0E0E] block mb-2"
          >
            Address Line 1
          </label>
          <input
            id="billingAddressLine1"
            type="text"
            value={formData.billingAddressLine1}
            onChange={(e) =>
              handleInputChange("billingAddressLine1", e.target.value)
            }
            className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
          />
          {errors.billingAddressLine1 && (
            <p className="text-red-500 text-sm mt-1">
              {errors.billingAddressLine1}
            </p>
          )}
          <label
            htmlFor="billingAddressLine2"
            className="text-lg font-semibold text-[#0E0E0E] block mb-2 mt-4"
          >
            Address Line 2
          </label>
          <input
            id="billingAddressLine2"
            type="text"
            value={formData.billingAddressLine2}
            onChange={(e) =>
              handleInputChange("billingAddressLine2", e.target.value)
            }
            className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
          />
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="md:w-1/2 w-full">
            <label
              htmlFor="billingCity"
              className="text-lg font-semibold text-[#0E0E0E] mb-2 block"
            >
              City
            </label>
            <input
              id="billingCity"
              type="text"
              value={formData.billingCity}
              onChange={(e) => handleInputChange("billingCity", e.target.value)}
              className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
            />
            {errors.billingCity && (
              <p className="text-red-500 text-sm mt-1">{errors.billingCity}</p>
            )}
          </div>
          <div className="md:w-1/2 w-full">
            <label
              htmlFor="billingPostcode"
              className="text-lg font-semibold text-[#0E0E0E] mb-2 block"
            >
              Postcode
            </label>
            <input
              id="billingPostcode"
              type="text"
              value={formData.billingPostcode}
              onChange={(e) =>
                handleInputChange("billingPostcode", e.target.value)
              }
              className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded-lg px-3 sm:px-4 py-2.5 sm:py-3 md:py-3.5 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:border-transparent"
            />
            {errors.billingPostcode && (
              <p className="text-red-500 text-sm mt-1">
                {errors.billingPostcode}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
