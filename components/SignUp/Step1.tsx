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
  errors
}: {
  formData: FormDataType;
  handleInputChange: HandleInputChange;
  errors: ErrorsType;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-6">
        What type of account do you want to create?
      </h2>

      <div className="grid grid-cols-2 gap-2">
        <label
          className={`px-4 py-2 border rounded-lg cursor-pointer ${
            formData.accountType === "Bidding"
              ? "border-purple-600 bg-purple-50"
              : "border-gray-300"
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
          <div className="flex items-center gap-2">
            <div className={`w-5 h-5 border-2 rounded flex items-center justify-center transition-all ${
              formData.accountType === "Bidding" ? "bg-[#9F13FB] border-[#9F13FB]" : "border-gray-300"
            }`}>
              {formData.accountType === "Bidding" && (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span className="font-semibold text-lg">Bidding</span>
          </div>
        </label>
        <label
          className={`px-4 py-2 border rounded-lg cursor-not-allowed opacity-50 bg-gray-100`}
        >
          <input
            type="radio"
            name="accountType"
            value="Seller"
            checked={formData.accountType === "Seller"}
            onChange={(e) => handleInputChange("accountType", e.target.value)}
            className="hidden"
            disabled
          />
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-gray-300 rounded flex items-center justify-center opacity-50"></div>
              <span className="font-semibold text-lg">Seller</span>
            </div>
            <span className="flex items-center text-[#4D4D4D] text-xs border border-[#E3E3E3] bg-[#F7F7F7] rounded-full px-2.5 py-1 font-bold">Coming Soon</span>
          </div>
        </label>
      </div>
      {errors.accountType && <p className="text-red-500 text-sm mt-2">{errors.accountType}</p>}
    </div>
  );
}