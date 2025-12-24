"use client";

type FormDataType = {
  shippingSameAsBilling: boolean;
  shippingCountry?: string;
  shippingAddressLine1?: string;
  shippingAddressLine2?: string;
  shippingCity?: string;
  shippingPostcode?: string;
};

type HandleInputChange = (key: string, value: string | boolean) => void;

type ErrorsType = {
  shippingCountry?: string;
  shippingAddressLine1?: string;
  shippingCity?: string;
  shippingPostcode?: string;
};

export default function Step4({
  formData,
  handleInputChange,
  errors
}: {
  formData: FormDataType;
  handleInputChange: HandleInputChange;
  errors: ErrorsType;
}) {
  const countries = [
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
      <h2 className="text-xl font-semibold mb-3">Shipping Address</h2>

      <label className="flex items-center gap-2 mb-4 pb-6 border-b border-[#e3e3e3]">
        <input
          type="checkbox"
          checked={formData.shippingSameAsBilling}
          onChange={(e) =>
            handleInputChange("shippingSameAsBilling", e.target.checked)
          }
        />
        My shipping address same as my billing address
      </label>

      {!formData.shippingSameAsBilling && (
        <div className="space-y-4">
          <div>
            <label
              htmlFor="shippingCountry"
              className="text-lg font-semibold text-[#0E0E0E] block mb-2"
            >
              Country
            </label>
            <select
              id="shippingCountry"
              value={formData.shippingCountry}
              onChange={(e) =>
                handleInputChange("shippingCountry", e.target.value)
              }
              className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded p-2 text-sm focus:outline-none focus:ring-0"
              aria-label="Shipping Country"
            >
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            {errors.shippingCountry && (
              <p className="text-red-500 text-sm mt-1">
                {errors.shippingCountry}
              </p>
            )}
          </div>
          <div>
            <label
              htmlFor="shippingAddressLine1"
              className="text-lg font-semibold text-[#0E0E0E] block mb-2"
            >
              Address Line 1
            </label>
            <input
              id="shippingAddressLine1"
              type="text"
              value={formData.shippingAddressLine1}
              onChange={(e) =>
                handleInputChange("shippingAddressLine1", e.target.value)
              }
              className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded p-2 focus:outline-none focus:ring-0"
            />
            {errors.shippingAddressLine1 && (
              <p className="text-red-500 text-sm mt-1">
                {errors.shippingAddressLine1}
              </p>
            )}
            <label
              htmlFor="shippingAddressLine2"
              className="text-lg font-semibold text-[#0E0E0E] block mb-2 mt-4"
            >
              Address Line 2
            </label>
            <input
              id="shippingAddressLine2"
              type="text"
              value={formData.shippingAddressLine2}
              onChange={(e) =>
                handleInputChange("shippingAddressLine2", e.target.value)
              }
              className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded p-2 focus:outline-none focus:ring-0"
            />
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="md:w-1/2 w-full">
              <label
                htmlFor="shippingCity"
                className="text-lg font-semibold text-[#0E0E0E] mb-2 block"
              >
                City
              </label>
              <input
                id="shippingCity"
                type="text"
                value={formData.shippingCity}
                onChange={(e) =>
                  handleInputChange("shippingCity", e.target.value)
                }
                className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded p-2 focus:outline-none focus:ring-0"
              />
              {errors.shippingCity && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.shippingCity}
                </p>
              )}
            </div>
            <div className="md:w-1/2 w-full">
              <label
                htmlFor="shippingPostcode"
                className="text-lg font-semibold text-[#0E0E0E] mb-2 block"
              >
                Postcode
              </label>
              <input
                id="shippingPostcode"
                type="text"
                value={formData.shippingPostcode}
                onChange={(e) =>
                  handleInputChange("shippingPostcode", e.target.value)
                }
                className="w-full border border-[#E3E3E3] bg-[#F7F7F7] rounded p-2 focus:outline-none focus:ring-0"
              />
              {errors.shippingPostcode && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.shippingPostcode}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
