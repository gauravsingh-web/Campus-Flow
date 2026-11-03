import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Search,
  Plus,
  Sparkles,
  MapPin,
  Calendar,
  CheckCircle,
  Tag,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Loader2,
  X,
  FileCheck,
} from 'lucide-react';
import api from '../../services/api';

const CATEGORIES = [
  'All',
  'Electronics',
  'ID & Cards',
  'Books & Stationery',
  'Keys & Wallets',
  'Clothing',
  'Accessories',
  'Other',
];

export default function LostFoundPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reportTypeFilter, setReportTypeFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [search, setSearch] = useState('');

  // Modals & Panels
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const [activeItemForClaim, setActiveItemForClaim] = useState(null);
  const [claimProof, setClaimProof] = useState('');
  const [claimPhone, setClaimPhone] = useState('');

  // Matching Drawer
  const [matchModalItem, setMatchModalItem] = useState(null);
  const [matches, setMatches] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(false);

  // Report Form
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    reportType: 'Lost',
    location: '',
    dateLostFound: new Date().toISOString().split('T')[0],
    contactPreference: 'Email',
  });
  const [imageFile, setImageFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      let url = '/lost-found?';
      if (reportTypeFilter !== 'All') url += `reportType=${reportTypeFilter}&`;
      if (categoryFilter !== 'All') url += `category=${categoryFilter}&`;
      if (search) url += `search=${encodeURIComponent(search)}&`;

      const res = await api.get(url);
      if (res.data.success) {
        setItems(res.data.items);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [reportTypeFilter, categoryFilter, search]);

  const handleCreateReport = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const formData = new FormData();
      Object.keys(form).forEach((k) => formData.append(k, form[k]));
      if (imageFile) formData.append('image', imageFile);

      const res = await api.post('/lost-found', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data.success) {
        setIsReportModalOpen(false);
        setForm({
          title: '',
          description: '',
          category: 'Electronics',
          reportType: 'Lost',
          location: '',
          dateLostFound: new Date().toISOString().split('T')[0],
          contactPreference: 'Email',
        });
        setImageFile(null);
        fetchItems();

        if (res.data.potentialMatches?.length > 0) {
          // Open match modal with newly computed matches
          setMatchModalItem(res.data.item);
          setMatches(res.data.potentialMatches);
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Report submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenMatches = async (item) => {
    setMatchModalItem(item);
    setLoadingMatches(true);
    try {
      const res = await api.get(`/lost-found/${item._id}/matches`);
      if (res.data.success) {
        setMatches(res.data.matches);
      }
    } catch (err) {
      alert('Could not compute similarity matches');
    } finally {
      setLoadingMatches(false);
    }
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post(`/lost-found/${activeItemForClaim._id}/claim`, {
        proofDescription: claimProof,
        contactPhone: claimPhone,
      });

      if (res.data.success) {
        alert('Claim submitted for administrator review!');
        setIsClaimModalOpen(false);
        setClaimProof('');
        setClaimPhone('');
        fetchItems();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Claim submission failed');
    }
  };

  const handleVerifyClaim = async (claimId, status) => {
    try {
      const res = await api.patch(`/lost-found/claims/${claimId}/verify`, {
        status,
        reviewNotes: `Claim verified by ${user.name}`,
      });
      if (res.data.success) {
        alert(`Claim ${status.toLowerCase()}!`);
        fetchItems();
      }
    } catch (err) {
      alert('Failed to verify claim');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Lost & Found Campus Registry
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Report misplaced belongings, find recovered items, and run deterministic matching algorithms.
          </p>
        </div>

        <button
          onClick={() => setIsReportModalOpen(true)}
          className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-blue-600 hover:from-brand-700 hover:to-blue-700 text-white font-semibold text-xs shadow-md shadow-brand-500/20 transition self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Report Item</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search items by name, keywords, or location..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-transparent focus:border-brand-500 focus:outline-hidden"
          />
        </div>

        {/* Report Type Filter Buttons */}
        <div className="flex items-center space-x-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
          {['All', 'Lost', 'Found'].map((t) => (
            <button
              key={t}
              onClick={() => setReportTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                reportTypeFilter === t
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                categoryFilter === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Item Catalog Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <Loader2 size={30} className="animate-spin text-brand-600" />
          <span className="text-xs text-slate-400">Loading catalog items...</span>
        </div>
      ) : items.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle className="mx-auto mb-2 text-emerald-500" size={36} />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Listings Found</h3>
          <p className="text-xs text-slate-400 mt-1">Try broadening your search or report a new item.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items.map((item) => {
            const isLost = item.reportType === 'Lost';
            const isReporter = item.reporter?._id === user?._id;

            return (
              <div
                key={item._id}
                className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden flex flex-col justify-between hover:border-brand-300 dark:hover:border-brand-700 transition"
              >
                <div>
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-44 object-cover"
                    />
                  ) : (
                    <div className="w-full h-32 bg-gradient-to-tr from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-800/40 flex items-center justify-center text-slate-400 text-xs">
                      No Image Provided
                    </div>
                  )}

                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isLost
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {item.reportType.toUpperCase()}
                      </span>
                      <span className="text-[11px] font-medium text-slate-400 capitalize">
                        {item.category}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>

                    <div className="pt-2 text-xs text-slate-400 space-y-1">
                      <div className="flex items-center space-x-1.5">
                        <MapPin size={13} className="text-slate-400" />
                        <span className="truncate">{item.location}</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Calendar size={13} className="text-slate-400" />
                        <span>Date: {new Date(item.dateLostFound).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenMatches(item)}
                    className="flex-1 flex items-center justify-center space-x-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <Sparkles size={13} />
                    <span>Match Engine</span>
                  </button>

                  {!isReporter && item.status === 'Open' && (
                    <button
                      onClick={() => {
                        setActiveItemForClaim(item);
                        setIsClaimModalOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-slate-100 transition"
                    >
                      Claim
                    </button>
                  )}
                </div>

                {/* Admin Claim Approval Section */}
                {user?.role === 'admin' && item.claims?.length > 0 && (
                  <div className="p-3 bg-brand-50/40 dark:bg-brand-950/20 border-t border-brand-100 dark:border-brand-900 text-xs space-y-2">
                    <span className="font-bold text-brand-900 dark:text-brand-300">Pending Claims ({item.claims.length})</span>
                    {item.claims.map((c) => (
                      <div key={c._id} className="p-2 bg-white dark:bg-slate-800 rounded-lg space-y-1">
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{c.proofDescription}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-400">Status: {c.status}</span>
                          {c.status === 'Pending' && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleVerifyClaim(c._id, 'Approved')}
                                className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleVerifyClaim(c._id, 'Rejected')}
                                className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Intelligent Match Engine Drawer */}
      {matchModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 text-white flex items-center justify-center">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-white">
                    Intelligent Reciprocal Matcher
                  </h3>
                  <span className="text-xs text-slate-400">Comparing "{matchModalItem.title}"</span>
                </div>
              </div>
              <button
                onClick={() => setMatchModalItem(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            {loadingMatches ? (
              <div className="py-16 text-center space-y-2">
                <Loader2 size={30} className="animate-spin text-brand-600 mx-auto" />
                <p className="text-xs text-slate-400">
                  Running tokenization, Jaccard keyword overlap, location & date proximity algorithms...
                </p>
              </div>
            ) : matches.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No matching reciprocal listings scored above 20% similarity threshold.
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-500">
                  Algorithm computed {matches.length} prospective match(es) ranked by multi-factor similarity:
                </p>

                {matches.map(({ item, score, breakdown }) => (
                  <div
                    key={item._id}
                    className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.reportType === 'Lost' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {item.reportType}
                          </span>
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{item.title}</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                        <span className="text-[11px] text-slate-400 block mt-1">Location: {item.location}</span>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="inline-block px-3 py-1 rounded-full text-xs font-black bg-brand-600 text-white shadow-xs">
                          {score}% Match
                        </span>
                      </div>
                    </div>

                    {/* Transparent Similarity Breakdown */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 grid grid-cols-4 gap-2 text-center text-[10px]">
                      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg">
                        <span className="text-slate-400 block">Category (30%)</span>
                        <strong className="text-slate-700 dark:text-slate-200">{breakdown.categoryMatch}%</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg">
                        <span className="text-slate-400 block">Keywords (35%)</span>
                        <strong className="text-slate-700 dark:text-slate-200">{breakdown.textSimilarity}%</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg">
                        <span className="text-slate-400 block">Location (20%)</span>
                        <strong className="text-slate-700 dark:text-slate-200">{breakdown.locationProximity}%</strong>
                      </div>
                      <div className="bg-white dark:bg-slate-800 p-1.5 rounded-lg">
                        <span className="text-slate-400 block">Date (15%)</span>
                        <strong className="text-slate-700 dark:text-slate-200">{breakdown.dateProximity}%</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Claim Modal */}
      {isClaimModalOpen && activeItemForClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <h3 className="font-bold text-base text-slate-900 dark:text-white mb-2">
              Submit Ownership Claim
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Claiming item: <strong>{activeItemForClaim.title}</strong>
            </p>

            <form onSubmit={handleSubmitClaim} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Proof of Ownership & Unique Marks
                </label>
                <textarea
                  rows={4}
                  required
                  value={claimProof}
                  onChange={(e) => setClaimProof(e.target.value)}
                  placeholder="Describe unique identifying marks, contents, serial numbers, wallpapers, or proof of purchase..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Contact Phone Number
                </label>
                <input
                  type="text"
                  value={claimPhone}
                  onChange={(e) => setClaimPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsClaimModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition"
                >
                  Submit for Verification
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Report Item Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">Report Item Listing</h3>
              <button
                onClick={() => setIsReportModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateReport} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Report Type
                  </label>
                  <select
                    value={form.reportType}
                    onChange={(e) => setForm({ ...form, reportType: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="Lost">I Lost Something</option>
                    <option value="Found">I Found Something</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  >
                    {CATEGORIES.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Item Title
                </label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="e.g. Blue Dell Laptop Backpack with Charger"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Campus Location
                  </label>
                  <input
                    type="text"
                    required
                    value={form.location}
                    onChange={(e) => setForm({ ...form, location: e.target.value })}
                    placeholder="e.g. Central Library 1st Floor"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={form.dateLostFound}
                    onChange={(e) => setForm({ ...form, dateLostFound: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Description & Distinguishing Features
                </label>
                <textarea
                  rows={3}
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Include color, model, brand, keychains, scratches..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 mb-1">
                  Photo (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand-50 file:text-brand-700"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-xl shadow-md transition disabled:opacity-50"
                >
                  {submitting ? 'Publishing Report...' : 'Publish Item Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
