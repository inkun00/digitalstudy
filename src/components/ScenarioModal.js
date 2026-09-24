"use client";

import React, { useState } from "react";
import Image from "next/image";
import { SCENARIOS } from "@/lib/scenarios";

export default function ScenarioModal({
  isOpen,
  onClose,
  selectedScenarioId,
  onSelectScenario,
}) {
  const [gradeFilter, setGradeFilter] = useState("all");

  if (!isOpen) return null;

  const filteredScenarios = SCENARIOS.filter((sc) => {
    if (gradeFilter === "all") return true;
    return sc.grade === gradeFilter;
  });

  const getGradeCount = (grade) => {
    if (grade === "all") return SCENARIOS.length;
    return SCENARIOS.filter((s) => s.grade === grade).length;
  };

  const getGradeBadgeColor = (grade) => {
    if (grade === "4학년") return { bg: "#FFF4E6", text: "#D97706", border: "#FDE68A" };
    if (grade === "5학년") return { bg: "#E6FFFA", text: "#0D9488", border: "#99F6E4" };
    return { bg: "#F3E8FF", text: "#7E22CE", border: "#E9D5FF" };
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>📋 상담할 친구 사연 선택하기 (총 10명)</h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "75vh" }}>
          {/* 학년별 필터 탭 */}
          <div style={{ display: "flex", gap: "6px", marginBottom: "4px" }}>
            {[
              { id: "all", label: "전체" },
              { id: "4학년", label: "4학년" },
              { id: "5학년", label: "5학년" },
              { id: "6학년", label: "6학년" },
            ].map((tab) => {
              const active = gradeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setGradeFilter(tab.id)}
                  style={{
                    flex: 1,
                    padding: "7px 0",
                    fontSize: "12px",
                    fontWeight: active ? "700" : "500",
                    borderRadius: "10px",
                    border: active ? "1.5px solid #18868A" : "1px solid #E2E8F0",
                    background: active ? "#18868A" : "#F8FAFC",
                    color: active ? "#FFF" : "#64748B",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  {tab.label} ({getGradeCount(tab.id)})
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {filteredScenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              const gColor = getGradeBadgeColor(sc.grade);
              return (
                <div
                  key={sc.id}
                  className={`scenario-card-item ${isSelected ? "selected" : ""}`}
                  style={{
                    borderWidth: isSelected ? "2px" : "1px",
                    borderColor: isSelected ? "#18868A" : "#E2E8F0",
                  }}
                  onClick={() => {
                    onSelectScenario(sc.id);
                    onClose();
                  }}
                >
                  <Image
                    src={sc.avatar}
                    alt={sc.name}
                    width={56}
                    height={56}
                    sizes="56px"
                    className="card-avatar"
                    style={{
                      width: "56px",
                      height: "56px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      flexShrink: 0,
                      border: "2px solid #FFF",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                    }}
                  />
                  <div className="scenario-card-text" style={{ flex: 1, minWidth: 0 }}>
                    <div className="scenario-card-title-row" style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                      <span className="scenario-friend-name" style={{ fontWeight: "700", fontSize: "14px" }}>
                        {sc.name}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 6px",
                          borderRadius: "6px",
                          background: gColor.bg,
                          color: gColor.text,
                          border: `1px solid ${gColor.border}`,
                        }}
                      >
                        {sc.grade}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          color: "#0F766E",
                          background: "#F0FDFA",
                          border: "1px solid #99F6E4",
                          padding: "2px 8px",
                          borderRadius: "8px",
                          fontWeight: "600",
                          marginLeft: "auto",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {sc.tag.split("·")[0].trim()}
                      </span>
                    </div>
                    <p
                      className="scenario-desc"
                      style={{
                        fontSize: "12px",
                        color: "#4A5568",
                        lineHeight: "1.4",
                        margin: 0,
                      }}
                    >
                      {sc.storyBrief}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
