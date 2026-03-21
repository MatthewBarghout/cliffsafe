export default function AdvisorChat() {
  return (
    <div className="bg-white rounded-2xl shadow-md p-8 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-cliff-600 flex items-center justify-center text-white font-bold text-lg">
          C
        </div>
        <div>
          <h2 className="text-lg font-bold text-cliff-900">CliffSafe Advisor</h2>
          <p className="text-xs text-gray-400">Powered by Claude AI — coming soon</p>
        </div>
      </div>

      <div className="bg-gray-50 rounded-xl p-5 min-h-[180px] flex flex-col justify-end space-y-3">
        <div className="bg-cliff-600 text-white text-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] self-start">
          Hi! I'm your CliffSafe advisor. Once this feature is live, I'll be able to answer
          questions about your specific benefits situation, explain cliff mechanics, and help you
          plan income strategies in plain language.
        </div>
        <div className="bg-white border border-gray-200 text-gray-700 text-sm rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%] self-end">
          That sounds helpful — when will you be ready?
        </div>
        <div className="bg-cliff-600 text-white text-sm rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%] self-start">
          Soon! The Claude API integration is planned for the next development phase. Stay tuned.
        </div>
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          disabled
          placeholder="Chat coming soon…"
          className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
        />
        <button
          disabled
          className="bg-cliff-200 text-cliff-400 font-semibold px-4 py-2.5 rounded-lg text-sm cursor-not-allowed"
        >
          Send
        </button>
      </div>
    </div>
  );
}
