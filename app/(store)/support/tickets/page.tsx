'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Array<{ id: string; ticketId: string; subject: string; category: string; priority: string; status: string; created: string; lastUpdate: string; messages: number }>>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState('all');

  useEffect(() => {
    async function fetchTickets() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setTickets([]);
          return;
        }
        const { data, error } = await supabase
          .from('support_tickets')
          .select('id, ticket_number, subject, category, status, priority, created_at, updated_at')
          .or(`user_id.eq.${user.id},email.eq.${user.email}`)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const mapped = (data || []).map((t: any) => ({
          id: `TKT-${String(t.ticket_number || '').padStart(4, '0')}`,
          ticketId: t.id,
          subject: t.subject,
          category: t.category || 'General',
          priority: t.priority || 'medium',
          status: t.status || 'open',
          created: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : '',
          lastUpdate: t.updated_at ? new Date(t.updated_at).toISOString().split('T')[0] : '',
          messages: 0,
        }));
        setTickets(mapped);
      } catch {
        setTickets([]);
      } finally {
        setLoading(false);
      }
    }
    fetchTickets();
  }, []);

  const filteredTickets = selectedFilter === 'all'
    ? tickets
    : tickets.filter(ticket => ticket.status === selectedFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'in_progress': return 'bg-amber-100 text-amber-700';
      case 'resolved': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-700';
      case 'normal': return 'text-blue-700';
      case 'low': return 'text-gray-700';
      default: return 'text-gray-700';
    }
  };

  return (
    <>
      <main className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">My Support Tickets</h1>
              <p className="text-gray-600">Track and manage your support requests</p>
            </div>
            <Link
              href="/support/ticket"
              className="bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
            >
              <i className="ri-add-line mr-2"></i>
              New Ticket
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
            <div className="flex border-b border-gray-200 overflow-x-auto">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-6 py-4 font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  selectedFilter === 'all'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                All Tickets ({tickets.length})
              </button>
              <button
                onClick={() => setSelectedFilter('open')}
                className={`px-6 py-4 font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  selectedFilter === 'open'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Open ({tickets.filter(t => t.status === 'open').length})
              </button>
              <button
                onClick={() => setSelectedFilter('in_progress')}
                className={`px-6 py-4 font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  selectedFilter === 'in_progress'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                In Progress ({tickets.filter(t => t.status === 'in_progress').length})
              </button>
              <button
                onClick={() => setSelectedFilter('resolved')}
                className={`px-6 py-4 font-semibold whitespace-nowrap border-b-2 transition-colors ${
                  selectedFilter === 'resolved'
                    ? 'border-blue-700 text-blue-700'
                    : 'border-transparent text-gray-600 hover:text-gray-900'
                }`}
              >
                Resolved ({tickets.filter(t => t.status === 'resolved').length})
              </button>
            </div>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-12 h-12 border-2 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-gray-600">Loading tickets...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <div className="w-20 h-20 flex items-center justify-center bg-gray-100 rounded-full mx-auto mb-6">
                <i className="ri-ticket-line text-4xl text-gray-400"></i>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">No tickets found</h2>
              <p className="text-gray-600 mb-6">You don't have any support tickets yet</p>
              <Link
                href="/support/ticket"
                className="inline-block bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-semibold transition-colors whitespace-nowrap"
              >
                Create Your First Ticket
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/support/tickets/${ticket.ticketId}`}
                  className="block bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition-all border-2 border-transparent hover:border-blue-700"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{ticket.subject}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getStatusColor(ticket.status)}`}>
                          {ticket.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-3">{ticket.category} • Ticket #{ticket.id}</p>
                      <div className="flex items-center space-x-6 text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <i className="ri-calendar-line"></i>
                          <span>Created {ticket.created}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="ri-time-line"></i>
                          <span>Updated {ticket.lastUpdate}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <i className="ri-message-3-line"></i>
                          <span>{ticket.messages} messages</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className={`flex items-center space-x-1 font-semibold ${getPriorityColor(ticket.priority)}`}>
                        <i className={`ri-flag-${ticket.priority === 'high' ? 'fill' : 'line'}`}></i>
                        <span className="capitalize">{ticket.priority}</span>
                      </div>
                      <i className="ri-arrow-right-s-line text-2xl text-gray-400"></i>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-8 grid md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg mb-4">
                <i className="ri-time-line text-2xl text-blue-700"></i>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Response Time</h3>
              <p className="text-2xl font-bold text-blue-700 mb-1">24 hours</p>
              <p className="text-sm text-gray-600">Average response time</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 rounded-lg mb-4">
                <i className="ri-checkbox-circle-line text-2xl text-blue-700"></i>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Resolution Rate</h3>
              <p className="text-2xl font-bold text-blue-700 mb-1">95%</p>
              <p className="text-sm text-gray-600">First contact resolution</p>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="w-12 h-12 flex items-center justify-center bg-purple-100 rounded-lg mb-4">
                <i className="ri-customer-service-line text-2xl text-purple-700"></i>
              </div>
              <h3 className="font-bold text-gray-900 mb-2">Support Hours</h3>
              <p className="text-2xl font-bold text-purple-700 mb-1">24/7</p>
              <p className="text-sm text-gray-600">Always here to help</p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
