"use client";

type FormDataType = {
  accountType?: string;
};

type HandleInputChange = (key: string, value: string) => void;

type ErrorsType = {
  accountType?: string;
};

export default function Step1({
  formData,
  handleInputChange,
  errors,
}: {
  formData: FormDataType;
  handleInputChange: HandleInputChange;
  errors: ErrorsType;
}) {
  return (
    <div className="w-full overflow-x-hidden">
      <h2 className="text-base md:text-lg lg:text-xl xl:text-2xl font-semibold mb-4 md:mb-6 break-words">
        What type of account do you want to create?
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-2 xl:gap-3">
        <label
          className={`px-3 md:px-4 xl:px-6 py-3 md:py-2 xl:py-3 border rounded-lg cursor-pointer transition-all ${
            formData.accountType === "Bidding"
              ? "border-purple-600 bg-purple-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            type="radio"
            name="accountType"
            value="Bidding"
            checked={formData.accountType === "Bidding"}
            onChange={(e) => handleInputChange("accountType", e.target.value)}
            className="hidden"
          />
          <div className="flex items-center gap-2 xl:gap-3">
            <div
              className={`w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6 border-2 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                formData.accountType === "Bidding"
                  ? "bg-[#9F13FB] border-[#9F13FB]"
                  : "border-gray-300"
              }`}
            >
              {formData.accountType === "Bidding" && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="md:w-3.5 md:h-3.5 xl:w-4 xl:h-4"
                >
                  <path
                    d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="font-semibold text-sm md:text-base lg:text-lg xl:text-xl whitespace-nowrap">
              Bidding
            </span>
          </div>
        </label>
        <label
          className={`px-3 md:px-4 xl:px-6 py-3 md:py-2 xl:py-3 border rounded-lg cursor-pointer transition-all ${
            formData.accountType === "Seller"
              ? "border-purple-600 bg-purple-50"
              : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            type="radio"
            name="accountType"
            value="Seller"
            checked={formData.accountType === "Seller"}
            onChange={(e) => handleInputChange("accountType", e.target.value)}
            className="hidden"
          />
          <div className="flex items-center gap-2 xl:gap-3">
            <div
              className={`w-4 h-4 md:w-5 md:h-5 xl:w-6 xl:h-6 border-2 rounded flex items-center justify-center transition-all flex-shrink-0 ${
                formData.accountType === "Seller"
                  ? "bg-[#9F13FB] border-[#9F13FB]"
                  : "border-gray-300"
              }`}
            >
              {formData.accountType === "Seller" && (
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="md:w-3.5 md:h-3.5 xl:w-4 xl:h-4"
                >
                  <path
                    d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </div>
            <span className="font-semibold text-sm md:text-base lg:text-lg xl:text-xl whitespace-nowrap">
              Seller
            </span>
          </div>
        </label>
      </div>
      {errors.accountType && (
        <p className="text-red-500 text-xs md:text-sm xl:text-base mt-2">
          {errors.accountType}
        </p>
      )}
    </div>
  );
}
