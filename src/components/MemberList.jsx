/**
 * MemberList - Display room members
 * @author Senior FE Developer
 * @version 1.0
 */

import React from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { MEMBER_ROLES } from '../types/watch';
import '../css/MemberList.css';

dayjs.extend(relativeTime);

/**
 * @typedef {import('../types/watch').Member} Member
 */

export function MemberList({ members = [], currentUserId }) {
  /**
   * Get role badge
   */
  const getRoleBadge = (role) => {
    switch (role) {
      case MEMBER_ROLES.OWNER:
        return { text: 'Host', icon: '👑', className: 'role-owner' };
      case MEMBER_ROLES.CO_HOST:
        return { text: 'Co-Host', icon: '⭐', className: 'role-co-host' };
      default:
        return null;
    }
  };

  /**
   * Render single member
   */
  const renderMember = (member) => {
    const isCurrentUser = member.userId === currentUserId;
    const roleBadge = getRoleBadge(member.role);

    return (
      <div
        key={member.userId}
        className={`member-item ${isCurrentUser ? 'member-item-current' : ''}`}
      >
        {/* Avatar */}
        <div className="member-avatar">
          {member.avatarUrl ? (
            <img src={member.avatarUrl} alt={member.userName} />
          ) : (
            <div className="member-avatar-placeholder">
              {member.userName?.charAt(0)?.toUpperCase() || '?'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="member-info">
          <div className="member-name">
            {member.userName}
            {isCurrentUser && <span className="member-you">(Bạn)</span>}
          </div>

          {roleBadge && (
            <div className={`member-role ${roleBadge.className}`}>
              <span className="member-role-icon">{roleBadge.icon}</span>
              <span className="member-role-text">{roleBadge.text}</span>
            </div>
          )}

          {member.lastSeenAt && (
            <div className="member-last-seen">
              {dayjs(member.lastSeenAt).fromNow()}
            </div>
          )}
        </div>

        {/* Status indicator */}
        <div className="member-status">
          <div className="member-status-dot"></div>
        </div>
      </div>
    );
  };

  /**
   * Sort members by role
   */
  const sortedMembers = [...members].sort((a, b) => {
    const roleOrder = {
      [MEMBER_ROLES.OWNER]: 1,
      [MEMBER_ROLES.CO_HOST]: 2,
      [MEMBER_ROLES.MEMBER]: 3,
    };

    return roleOrder[a.role] - roleOrder[b.role];
  });

  return (
    <div className="member-list">
      <div className="member-list-header">
        <h3 className="member-list-title">
          Thành viên ({members.length})
        </h3>
      </div>

      <div className="member-list-content">
        {members.length === 0 ? (
          <div className="member-list-empty">
            <div className="member-list-empty-icon">👥</div>
            <div className="member-list-empty-text">Chưa có thành viên</div>
          </div>
        ) : (
          sortedMembers.map(renderMember)
        )}
      </div>
    </div>
  );
}

export default MemberList;
