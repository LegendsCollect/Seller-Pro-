import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { NewsArticle, GrailPull, CollectiblesVideo, ToppsSocialPost } from '../../types';
import { formatCurrency } from '../../utils/calculations';
import {
  Newspaper,
  Flame,
  Play,
  ExternalLink,
  Search,
  Sparkles,
  Camera,
  Share2,
  Bookmark,
  Check,
  Tag,
  Clock,
  Tv,
  X,
  ChevronRight,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  RefreshCw,
  MessageCircle,
  Repeat2,
  Heart,
  CheckCircle2,
  AtSign,
} from 'lucide-react';

export const NewsView: React.FC = () => {
  const { setActiveTab, openCrossListModal } = useApp();

  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [grailPulls, setGrailPulls] = useState<GrailPull[]>([]);
  const [videos, setVideos] = useState<CollectiblesVideo[]>([]);
  const [socialPosts, setSocialPosts] = useState<ToppsSocialPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Active filter tab
  const [activeSubTab, setActiveSubTab] = useState<'all' | 'news' | 'social' | 'pulls' | 'videos'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');

  // Modal states
  const [readingArticle, setReadingArticle] = useState<NewsArticle | null>(null);
  const [activeVideoModal, setActiveVideoModal] = useState<CollectiblesVideo | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/news');
      const json = await res.json();
      if (json.success && json.data) {
        setArticles(json.data.articles || []);
        setGrailPulls(json.data.grailPulls || []);
        setVideos(json.data.videos || []);
        setSocialPosts(json.data.toppsSocialPosts || []);
      }
    } catch (err) {
      console.error('Error fetching news:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarkedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filtered lists
  const filteredArticles = articles.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBrand =
      selectedBrandFilter === 'all' ||
      (selectedBrandFilter === 'topps' && a.source === 'Topps') ||
      (selectedBrandFilter === 'panini' && a.source === 'Panini');
    return matchesSearch && matchesBrand;
  });

  const filteredSocialPosts = socialPosts.filter((post) => {
    const matchesSearch =
      post.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.authorHandle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (post.topicTag && post.topicTag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesBrand = selectedBrandFilter === 'all' || selectedBrandFilter === 'topps';
    return matchesSearch && matchesBrand;
  });

  const filteredPulls = grailPulls.filter((p) => {
    const matchesSearch =
      p.cardTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.productSet.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.pulledBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesBrand =
      selectedBrandFilter === 'all' ||
      (selectedBrandFilter === 'topps' && p.manufacturer === 'Topps') ||
      (selectedBrandFilter === 'panini' && p.manufacturer === 'Panini');
    return matchesSearch && matchesBrand;
  });

  const filteredVideos = videos.filter((v) => {
    return (
      v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.channelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Hobby Intel & Drops Wire
            </h1>
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-900 text-white flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Live Feed
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Real-time updates from <strong>Topps</strong> and <strong>Panini</strong>, legendary cards pulled live in the wild, and top trending YouTube breaker videos.
          </p>
        </div>

        {/* Action button to open scanner */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('scanner')}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan My Cards</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
        {/* Sub-tab pills (Interactive Segmented Control) */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === 'all'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Updates
          </button>
          <button
            onClick={() => setActiveSubTab('news')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === 'news'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Topps & Panini News ({articles.length})
          </button>
          <button
            onClick={() => setActiveSubTab('social')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'social'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Topps on X & Threads</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-900 text-white font-mono">
              {socialPosts.length}
            </span>
          </button>
          <button
            onClick={() => setActiveSubTab('pulls')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === 'pulls'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Legendary Pulls ({grailPulls.length})
          </button>
          <button
            onClick={() => setActiveSubTab('videos')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeSubTab === 'videos'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            YouTube Videos ({videos.length})
          </button>
        </div>

        {/* Right side: Brand Filter & Search */}
        <div className="flex items-center gap-2">
          <select
            value={selectedBrandFilter}
            onChange={(e) => setSelectedBrandFilter(e.target.value)}
            className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 focus:outline-none"
          >
            <option value="all">All Brands</option>
            <option value="topps">Topps Only</option>
            <option value="panini">Panini Only</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search news, cards, pulls..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 w-44 sm:w-56"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="p-12 text-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
          <p className="text-xs text-slate-500">Loading live hobby feeds and breaker intelligence...</p>
        </div>
      ) : (
        <>
          {/* SECTION 1: Featured News Hero Split */}
          {(activeSubTab === 'all' || activeSubTab === 'news') && filteredArticles.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    Topps & Panini Headlines
                  </h2>
                  <p className="text-xs text-slate-500">
                    Product checklists, hobby box drop alerts, and manufacturer licensing updates.
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-mono">
                  {filteredArticles.length} stories
                </span>
              </div>

              {/* Lead Story Hero Card */}
              {filteredArticles[0] && (
                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:border-slate-300 transition-all grid grid-cols-1 lg:grid-cols-12">
                  <div className="lg:col-span-7 relative aspect-video lg:aspect-auto bg-slate-900 overflow-hidden">
                    <img
                      src={filteredArticles[0].imageUrl}
                      alt={filteredArticles[0].title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover hover:scale-102 transition-transform duration-300"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider bg-slate-900/90 text-amber-400 border border-amber-500/30">
                        {filteredArticles[0].source} Official
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-900/90 text-white">
                        {filteredArticles[0].category}
                      </span>
                    </div>
                  </div>

                  <div className="lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <span>{filteredArticles[0].source}</span>
                        <span aria-hidden="true">·</span>
                        <span>{filteredArticles[0].publishedDate}</span>
                        <span aria-hidden="true">·</span>
                        <span>{filteredArticles[0].readTime}</span>
                      </div>

                      <h3
                        onClick={() => setReadingArticle(filteredArticles[0])}
                        className="text-lg sm:text-xl font-extrabold text-slate-900 leading-snug cursor-pointer hover:text-emerald-700 transition-colors"
                      >
                        {filteredArticles[0].title}
                      </h3>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {filteredArticles[0].summary}
                      </p>

                      {filteredArticles[0].estimatedHobbyBoxPrice && (
                        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between font-mono-numbers">
                          <span className="text-slate-500 text-[11px]">Hobby Box Market Pre-Sale:</span>
                          <span className="font-extrabold text-slate-900">
                            {formatCurrency(filteredArticles[0].estimatedHobbyBoxPrice)}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <button
                        onClick={() => setReadingArticle(filteredArticles[0])}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <span>Read Full Story</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleBookmark(filteredArticles[0].id)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          bookmarkedIds.has(filteredArticles[0].id)
                            ? 'bg-amber-50 border-amber-300 text-amber-600'
                            : 'border-slate-200 text-slate-400 hover:text-slate-700'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Secondary News Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.slice(1).map((article) => (
                  <div
                    key={article.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{article.source}</span>
                          <span aria-hidden="true">·</span>
                          <span>{article.publishedDate}</span>
                          <span aria-hidden="true">·</span>
                          <span>{article.readTime}</span>
                        </div>
                        <button
                          onClick={() => toggleBookmark(article.id)}
                          className={`p-1 rounded ${
                            bookmarkedIds.has(article.id)
                              ? 'text-amber-500'
                              : 'text-slate-300 hover:text-slate-600'
                          }`}
                        >
                          <Bookmark className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <h4
                        onClick={() => setReadingArticle(article)}
                        className="text-sm font-bold text-slate-900 leading-snug cursor-pointer hover:text-emerald-700 transition-colors"
                      >
                        {article.title}
                      </h4>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {article.summary}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                      <div className="flex flex-wrap gap-1">
                        {article.tags.slice(0, 2).map((t, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>

                      <button
                        onClick={() => setReadingArticle(article)}
                        className="font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5 text-[11px]"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION: Topps Official Drops: X & Threads Feed */}
          {(activeSubTab === 'all' || activeSubTab === 'social') && filteredSocialPosts.length > 0 && (
            <section className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Topps Official Wire: Live Drops on X & Threads
                    </h2>
                    <span className="text-[10px] uppercase font-extrabold px-2.5 py-0.5 rounded-full bg-slate-900 text-white flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                      Direct Feeds
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Live announcements, bounty confirmations, print run records, and release calendars posted by <strong>@Topps</strong>.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href="https://x.com/Topps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <span>Follow @Topps on 𝕏</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                  <a
                    href="https://www.threads.net/@topps"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center gap-1 transition-colors"
                  >
                    <span>Follow @topps on Threads</span>
                    <ExternalLink className="w-3 h-3 text-slate-500" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSocialPosts.map((post) => (
                  <div
                    key={post.id}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                  >
                    <div className="space-y-3">
                      {/* Social Author Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                            <img
                              src={post.avatarUrl}
                              alt={post.authorName}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-1">
                              <span className="font-extrabold text-xs text-slate-900">
                                {post.authorName}
                              </span>
                              {post.verified && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-sky-500 fill-sky-50" />
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {post.authorHandle}
                            </span>
                          </div>
                        </div>

                        {/* Platform Badge & Timestamp */}
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1 ${
                              post.platform === 'X'
                                ? 'bg-black text-white'
                                : 'bg-slate-800 text-slate-100'
                            }`}
                          >
                            {post.platform === 'X' ? (
                              <span>𝕏 Post</span>
                            ) : (
                              <span>@ Threads</span>
                            )}
                          </span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {post.timestamp}
                          </span>
                        </div>
                      </div>

                      {/* Post Body */}
                      <p className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-normal">
                        {post.text.split(/(#[a-zA-Z0-9_]+)/g).map((chunk, i) =>
                          chunk.startsWith('#') ? (
                            <span key={i} className="font-bold text-sky-600 hover:underline cursor-pointer">
                              {chunk}
                            </span>
                          ) : (
                            chunk
                          )
                        )}
                      </p>

                      {post.topicTag && (
                        <div className="inline-block px-2 py-0.5 rounded bg-sky-50 border border-sky-100 text-[10px] font-bold text-sky-700 font-mono">
                          {post.topicTag}
                        </div>
                      )}
                    </div>

                    {/* Engagement Metric Strip & Action */}
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1 hover:text-slate-700">
                          <MessageCircle className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[11px]">{post.repliesCount}</span>
                        </span>
                        <span className="flex items-center gap-1 hover:text-emerald-600">
                          <Repeat2 className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[11px]">{post.repostsCount}</span>
                        </span>
                        <span className="flex items-center gap-1 hover:text-rose-600">
                          <Heart className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-mono text-[11px]">{post.likesCount}</span>
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActiveTab('scanner')}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1"
                        >
                          <Camera className="w-3 h-3 text-emerald-600" />
                          <span>Scan Drop</span>
                        </button>

                        <a
                          href={post.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1 text-slate-400 hover:text-slate-800 rounded transition-colors"
                          title="Open original post"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 2: Legendary Grail Pulls Gallery */}
          {(activeSubTab === 'all' || activeSubTab === 'pulls') && filteredPulls.length > 0 && (
            <section className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Pulled From The Wild: Legendary Cards Gallery
                    </h2>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                      <Flame className="w-3 h-3 text-amber-600" /> Verified Grails
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Real 1/1s, Downtowns, Kabooms, and game-used patch cards pulled live on Whatnot and YouTube.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPulls.map((pull) => (
                  <div
                    key={pull.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Card Visual Header */}
                      <div className="relative aspect-4/3 bg-slate-950 overflow-hidden">
                        <img
                          src={pull.imageUrl}
                          alt={pull.cardTitle}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />

                        {/* Badges on image */}
                        <div className="absolute top-3 left-3 flex items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-slate-900/90 text-emerald-400 border border-emerald-500/40">
                            {pull.serialNumber}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900/80 text-white">
                            {pull.manufacturer}
                          </span>
                        </div>

                        {/* Estimated Bounty / Value */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                          <div>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Estimated Market Bounty
                            </span>
                            <span className="text-lg font-black text-emerald-400 font-mono-numbers">
                              {formatCurrency(pull.estimatedValue)}
                            </span>
                          </div>
                          <span className="text-[10px] font-semibold text-slate-300 bg-slate-900/80 px-2 py-0.5 rounded">
                            {pull.pullPlatform}
                          </span>
                        </div>
                      </div>

                      {/* Info details */}
                      <div className="p-4 space-y-2">
                        <h4 className="text-xs font-bold text-slate-900 leading-snug">
                          {pull.cardTitle}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          Set: <span className="text-slate-800">{pull.productSet}</span>
                        </p>
                        <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                          {pull.details}
                        </p>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs bg-slate-50/50">
                      <span className="text-[11px] text-slate-500">
                        Pulled by <strong className="text-slate-800">{pull.pulledBy}</strong>
                      </span>

                      <button
                        onClick={() =>
                          openCrossListModal({
                            id: pull.id,
                            name: pull.cardTitle,
                            title: `${pull.cardTitle} ${pull.serialNumber} Authentic`,
                            price: Math.round(pull.estimatedValue * 0.95),
                            recommendedListingPrice: pull.estimatedValue,
                            category: 'Trading Cards',
                            imageUrl: pull.imageUrl,
                            suggestedDescription: pull.details,
                          })
                        }
                        className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-lg font-bold text-[11px] transition-colors flex items-center gap-1 shadow-2xs"
                      >
                        <Share2 className="w-3 h-3 text-emerald-600" />
                        <span>List Similar</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* SECTION 3: Curated YouTube Collectibles Videos Hub */}
          {(activeSubTab === 'all' || activeSubTab === 'videos') && filteredVideos.length > 0 && (
            <section className="space-y-4 pt-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-900">
                      Collectibles & Hobby Video Hub
                    </h2>
                    <span className="text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                      <Tv className="w-3 h-3 text-red-600" /> YouTube Curated
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    Watch box breaks, live high-roller pack rips, and market trends right inside SellerPro.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredVideos.map((video) => (
                  <div
                    key={video.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      {/* Video Thumbnail with Play Button */}
                      <div
                        onClick={() => setActiveVideoModal(video)}
                        className="relative aspect-video bg-slate-900 overflow-hidden cursor-pointer"
                      >
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-slate-950/40 group-hover:bg-slate-950/20 transition-colors flex items-center justify-center">
                          <div className="w-11 h-11 rounded-full bg-red-600 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-5 h-5 ml-0.5 fill-current" />
                          </div>
                        </div>

                        {/* Duration Badge */}
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono">
                          {video.duration}
                        </span>

                        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-slate-950/80 text-emerald-400 text-[10px] font-bold">
                          {video.category}
                        </span>
                      </div>

                      {/* Meta */}
                      <div className="p-3.5 space-y-1.5">
                        <h4
                          onClick={() => setActiveVideoModal(video)}
                          className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug cursor-pointer hover:text-red-600 transition-colors"
                        >
                          {video.title}
                        </h4>

                        <div className="text-[11px] text-slate-500 space-y-0.5">
                          <p className="font-semibold text-slate-700">{video.channelName}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            <span>{video.views}</span>
                            <span aria-hidden="true">·</span>
                            <span>{video.publishedTime}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 pt-0">
                      <button
                        onClick={() => setActiveVideoModal(video)}
                        className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[11px] transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3 h-3 text-red-600 fill-current" />
                        <span>Watch Video</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {/* Full Article Reader Modal */}
      {readingArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-900 text-amber-400">
                  {readingArticle.source} News
                </span>
                <span className="text-xs text-slate-500">
                  {readingArticle.publishedDate} · {readingArticle.readTime}
                </span>
              </div>
              <button
                onClick={() => setReadingArticle(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="aspect-video w-full rounded-xl overflow-hidden bg-slate-900">
                <img
                  src={readingArticle.imageUrl}
                  alt={readingArticle.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <h2 className="text-xl font-extrabold text-slate-900 leading-snug">
                {readingArticle.title}
              </h2>

              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line text-justify">
                {readingArticle.content}
              </p>

              {readingArticle.featuredCard && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">
                    Featured Chase Card
                  </span>
                  <p className="text-xs font-bold text-slate-900">
                    {readingArticle.featuredCard}
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  setReadingArticle(null);
                  setActiveTab('scanner');
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Cards from this Set</span>
              </button>

              <button
                onClick={() => setReadingArticle(null)}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden flex flex-col text-white">
            <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <h3 className="text-xs sm:text-sm font-bold truncate max-w-[400px]">
                  {activeVideoModal.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Embed Player */}
            <div className="relative aspect-video w-full bg-black">
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${activeVideoModal.youtubeId}?autoplay=1&rel=0`}
                title={activeVideoModal.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full border-0"
              />
            </div>

            <div className="p-4 sm:p-5 space-y-2 bg-slate-900">
              <div className="flex items-center justify-between text-xs">
                <div>
                  <h4 className="font-bold text-white text-sm">{activeVideoModal.channelName}</h4>
                  <p className="text-[11px] text-slate-400">{activeVideoModal.subscribers}</p>
                </div>
                <div className="text-right text-[11px] text-slate-400 font-mono">
                  <span>{activeVideoModal.views}</span> · <span>{activeVideoModal.publishedTime}</span>
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed pt-1 border-t border-slate-800">
                {activeVideoModal.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
