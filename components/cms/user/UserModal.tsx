'use client';

interface User {
  id: string;
  stripeCustomerId: string;
  accountType: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  email: string;
  phone: string;
  termsAccepted: boolean;
  newsletter: boolean;
  isVerified: boolean;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface UserModalProps {
  user: User | null;
  onClose: () => void;
}

export default function UserModal({ user, onClose }: UserModalProps) {
    if (!user) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">User Details</h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                        &times;
                    </button>
                </div>
                <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">ID</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.id}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Stripe Customer ID</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.stripeCustomerId}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Account Type</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.accountType}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.firstName} {user.middleName} {user.lastName}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.email}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Phone</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.phone}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Terms Accepted</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.termsAccepted ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Newsletter</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.newsletter ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Verified</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{user.isVerified ? 'Yes' : 'No'}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Created At</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{new Date(user.createdAt).toLocaleString()}</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Updated At</label>
                            <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{new Date(user.updatedAt).toLocaleString()}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-6 flex justify-end">
                    <button
                        onClick={onClose}
                        className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}