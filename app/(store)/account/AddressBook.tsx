'use client';

import { useState } from 'react';

interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

export default function AddressBook() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const deleteAddress = (id: string) => {
    setAddresses(addresses.filter(addr => addr.id !== id));
  };

  const setDefault = (id: string) => {
    setAddresses(addresses.map(addr => ({
      ...addr,
      isDefault: addr.id === id
    })));
  };

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-serif text-2xl text-[#050505] mb-1">Address Book</h2>
          <p className="text-neutral-500">Manage your shipping addresses.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-6 py-2.5 bg-[#050505] text-white rounded-full text-sm font-bold uppercase tracking-wider hover:bg-[#B8860B] transition-colors"
        >
          Add Address
        </button>
      </div>

      {showForm && (
        <div className="bg-white border rounded-2xl p-8 mb-8 shadow-sm">
          <h3 className="font-serif text-xl mb-6">
            {editingId ? 'Edit Address' : 'New Address'}
          </h3>
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Full Name</label>
                <input type="text" className="w-full border-b border-neutral-200 py-2 focus:border-[#B8860B] focus:outline-none transition-colors" placeholder="John Doe" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Phone</label>
                <input type="tel" className="w-full border-b border-neutral-200 py-2 focus:border-[#B8860B] focus:outline-none transition-colors" placeholder="+233..." />
              </div>
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Street Address</label>
                <input type="text" className="w-full border-b border-neutral-200 py-2 focus:border-[#B8860B] focus:outline-none transition-colors" placeholder="123 Oxford Street" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">City</label>
                <input type="text" className="w-full border-b border-neutral-200 py-2 focus:border-[#B8860B] focus:outline-none transition-colors" placeholder="Accra" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold uppercase tracking-widest text-neutral-500">Region</label>
                <input type="text" className="w-full border-b border-neutral-200 py-2 focus:border-[#B8860B] focus:outline-none transition-colors" placeholder="Greater Accra" />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <input type="checkbox" id="default" className="w-4 h-4 text-[#050505] border-neutral-300 rounded focus:ring-[#050505]" />
              <label htmlFor="default" className="text-sm text-neutral-600">Set as default address</label>
            </div>

            <div className="flex gap-4 pt-4">
              <button type="submit" className="px-8 py-3 bg-[#050505] text-white rounded-full font-bold uppercase tracking-widest hover:bg-[#B8860B] transition-colors">
                Save Address
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="px-8 py-3 border border-neutral-200 text-neutral-500 rounded-full font-bold uppercase tracking-widest hover:text-[#050505] hover:border-[#050505] transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {addresses.length === 0 && !showForm && (
          <div className="col-span-2 py-12 text-center text-neutral-400 border border-dashed border-neutral-200 rounded-2xl">
            <p>No addresses saved yet.</p>
          </div>
        )}
        {addresses.map((address) => (
          <div
            key={address.id}
            className={`p-6 border rounded-2xl relative group ${address.isDefault ? 'border-[#050505] bg-neutral-50/50' : 'border-neutral-200 hover:border-[#B8860B]'
              }`}
          >
            {address.isDefault && (
              <span className="absolute top-4 right-4 text-[10px] font-bold uppercase tracking-widest bg-[#050505] text-white px-2 py-1 rounded-md">
                Default
              </span>
            )}

            <div className="mb-4 pr-12">
              <h3 className="font-serif text-lg text-[#050505]">{address.name}</h3>
              <p className="text-sm text-neutral-500">{address.phone}</p>
            </div>

            <div className="text-sm text-neutral-600 space-y-1 mb-6 font-light">
              <p>{address.street}</p>
              <p>{address.city}, {address.state} {address.zipCode}</p>
              <p>{address.country}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => { setEditingId(address.id); setShowForm(true); }}
                className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-[#050505] transition-colors"
              >
                Edit
              </button>
              <div className="w-px h-3 bg-neutral-200" />
              {!address.isDefault && (
                <>
                  <button
                    onClick={() => setDefault(address.id)}
                    className="text-xs font-bold uppercase tracking-wider text-neutral-400 hover:text-[#050505] transition-colors"
                  >
                    Set Default
                  </button>
                  <div className="w-px h-3 bg-neutral-200" />
                </>
              )}
              <button
                onClick={() => deleteAddress(address.id)}
                className="text-xs font-bold uppercase tracking-wider text-red-400 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
