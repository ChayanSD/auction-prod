'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Users, Hammer, Package, BarChart3, CreditCard, FileText } from 'lucide-react';

export default function Pannel() {
  const cards = [
    {
      title: 'Users',
      description: 'Manage user accounts and permissions.',
      href: '/cms/pannel/users',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Auctions',
      description: 'Oversee auction listings and bids.',
      href: '/cms/pannel/auctions',
      icon: Hammer,
      color: 'text-green-600',
    },
    {
      title: 'Auction Items',
      description: 'Handle auction items and categories.',
      href: '/cms/pannel/auction-items',
      icon: Package,
      color: 'text-purple-600',
    },
    {
      title: 'Auction Requests',
      description: 'Review and approve auction listing requests.',
      href: '/cms/pannel/auction-requests',
      icon: FileText,
      color: 'text-orange-600',
    },
    {
      title: 'Bids',
      description: 'View all bids and send invoices to winners.',
      href: '/cms/pannel/bids',
      icon: Hammer,
      color: 'text-blue-600',
    },
    {
      title: 'Payments',
      description: 'View all payments and invoices.',
      href: '/cms/pannel/payments',
      icon: CreditCard,
      color: 'text-green-600',
    },
    {
      title: 'Analytics',
      description: 'View reports and analytics data.',
      href: null,
      icon: BarChart3,
      color: 'text-gray-600',
      disabled: true,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome to the admin panel. Manage your auction platform here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <Icon className={`w-8 h-8 ${card.color}`} />
                <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
              </div>
              <p className="text-gray-600 text-sm mb-4">{card.description}</p>
              {card.href ? (
                <Link href={card.href}>
                  <Button className="w-full">
                    Manage {card.title}
                  </Button>
                </Link>
              ) : (
                <Button variant="outline" className="w-full" disabled>
                  Coming Soon
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
