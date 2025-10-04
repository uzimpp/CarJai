import type { SellerContact } from "@/constants/user";

function getContactIcon(type: string) {
  switch (type.toLowerCase()) {
    case "phone":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
      );
    case "email":
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      );
    default:
      return (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
  }
}

export default function ContactList({
  contacts,
}: {
  contacts: SellerContact[];
}) {
  if (!contacts || contacts.length === 0) {
    return (
      <p className="text--1 text-gray-600">No contact information available</p>
    );
  }

  return (
    <div className="space-y-(--space-s)">
      {contacts.map((contact) => (
        <div
          key={contact.id}
          className="flex items-start p-(--space-s) rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex-shrink-0 text-maroon mt-1">
            {getContactIcon(contact.contactType)}
          </div>
          <div className="ml-3 flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text--1 font-medium text-gray-900 capitalize">
                {contact.contactType}
              </p>
              {contact.label && (
                <span className="text--2 text-gray-500 ml-2">
                  ({contact.label})
                </span>
              )}
            </div>
            <p className="text-0 text-gray-600 break-all mt-1">
              {contact.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
