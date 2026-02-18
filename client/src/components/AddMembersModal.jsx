import { useState, useMemo } from "react";
import { X, Search, UserPlus, Check } from "lucide-react";
import { useDispatch, useSelector } from "react-redux";
import { addGroupMembersThunk, getGroupMembersThunk } from "../features/groups/groupsSlice";
import { API_BASE_URL } from "../config/constants";

const AddMembersModal = ({ chatId, currentMembers = [], onClose }) => {
  const dispatch = useDispatch();
  const { users = [] } = useSelector((state) => state.user);

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [isAdding, setIsAdding] = useState(false);

  // Exclude users already in the group
  const currentMemberIds = currentMembers.map((m) => Number(m.userId));

  const filteredUsers = useMemo(
    () =>
      users.filter(
        (u) =>
          !currentMemberIds.includes(Number(u.id)) &&
          u.username?.toLowerCase().includes(search.toLowerCase()),
      ),
    [users, search, currentMemberIds],
  );

  const toggleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const handleAdd = async () => {
    if (!selected.length) return;
    setIsAdding(true);
    try {
      await dispatch(
        addGroupMembersThunk({ chatId, members: selected }),
      ).unwrap();
      await dispatch(getGroupMembersThunk(chatId));
      onClose();
    } catch (err) {
      console.error("Failed to add members:", err);
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden"
        style={{ maxHeight: "85vh" }}
      >
        {/* ── Header ── */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <UserPlus className="h-4 w-4 text-blue-500" />
              </div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">
                Add Members
              </h2>
            </div>
            <button
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 ml-12">
            {selected.length > 0
              ? `${selected.length} person${selected.length > 1 ? "s" : ""} selected`
              : "Choose people to add to this group"}
          </p>
        </div>

        {/* ── Selected chips ── */}
        {selected.length > 0 && (
          <div className="px-4 pt-3 pb-1 flex flex-wrap gap-2">
            {selected.map((id) => {
              const user = users.find((u) => u.id === id);
              if (!user) return null;
              return (
                <button
                  key={id}
                  onClick={() => toggleSelect(id)}
                  className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 px-2.5 py-1 rounded-full text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/50 transition"
                >
                  {user.username}
                  <X className="h-3 w-3" />
                </button>
              );
            })}
          </div>
        )}

        {/* ── Search ── */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
            <Search className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search users..."
              className="flex-1 bg-transparent text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
        </div>

        {/* ── User list ── */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                {search ? `No results for "${search}"` : "No users to add"}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {!search && "Everyone is already in this group"}
              </p>
            </div>
          ) : (
            filteredUsers.map((user) => {
              const isSelected = selected.includes(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleSelect(user.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all mb-0.5 text-left
                    ${
                      isSelected
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-semibold text-gray-600 dark:text-gray-300">
                      {user.profile_img ? (
                        <img
                          src={`${API_BASE_URL}${user.profile_img}`}
                          alt={user.username}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>{user.username?.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    {user.isOnline && (
                      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 bg-green-500 rounded-full border-2 border-white dark:border-gray-900" />
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${isSelected ? "text-blue-600 dark:text-blue-400" : "text-gray-900 dark:text-white"}`}
                    >
                      {user.username}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {user.isOnline ? "Online" : (user.email ?? "")}
                    </p>
                  </div>

                  {/* Checkbox */}
                  <div
                    className={`h-5 w-5 rounded-full flex-shrink-0 flex items-center justify-center border-2 transition-all
                    ${
                      isSelected
                        ? "bg-blue-500 border-blue-500"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {isSelected && (
                      <Check className="h-3 w-3 text-white" strokeWidth={3} />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* ── Footer ── */}
        <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!selected.length || isAdding}
            className="flex-1 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium text-white transition flex items-center justify-center gap-2"
          >
            {isAdding ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Add {selected.length > 0 ? `(${selected.length})` : ""}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddMembersModal;
