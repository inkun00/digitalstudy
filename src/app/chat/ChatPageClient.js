"use client";

import React, { useEffect, useState, useRef, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import KakaoHeader from "@/components/KakaoHeader";
import ChatList from "@/components/ChatList";
import ChatInput from "@/components/ChatInput";
import AssistantDrawer from "@/components/AssistantDrawer";
import ScenarioModal from "@/components/ScenarioModal";
import ReportModal from "@/components/ReportModal";
import ItemBagModal from "@/components/ItemBagModal";
import SongGiftModal from "@/components/SongGiftModal";
import { SCENARIOS } from "@/lib/scenarios";
import { INITIAL_COMFORT, clampScore, getSuggestedReplies } from "@/lib/evaluation";
import { getStoredProfile } from "@/lib/userProfile";
import { SHOP_ITEMS, applyFantasyItem, awardHeartPoints, pointsForScoreIncrease, useHeartWallet } from "@/lib/heartShop";
import { CLOUD_SESSION_EVENT, chatDirtyKey, chatStorageKey } from "@/lib/cloudState";
import { renderSongPdf } from "@/lib/songPdf";
import { downloadSongPdf, saveSongPdf } from "@/lib/songPdfStore";
import { canReceiveSongGift, SONG_FORMAT_ERROR, SONG_GIFT_REFUSAL } from "@/lib/songGiftConfig";
import { useCloudSession } from "@/components/CloudSyncProvider";

const subscribeToMount = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

function readSavedChat(scenarioId) {
  if (typeof window === "undefined") return null;
  try {
    const key = chatStorageKey(scenarioId);
    const saved = JSON.parse(localStorage.getItem(key) || sessionStorage.getItem(key) || "null");
    return saved && Array.isArray(saved.messages) && saved.messages.length <= 80 && saved.messages.every((message) =>
      ["user", "victim", "system"].includes(message.sender) && typeof message.text === "string" && message.text.length <= 2000) ? saved : null;
  } catch { return null; }
}

function currentTime() {
  const now = new Date();
  return `${now.getHours() >= 12 ? "오후" : "오전"} ${now.getHours() % 12 || 12}:${String(now.getMinutes()).padStart(2, "0")}`;
}

function initialMessages(scenario) {
  return scenario.initialMessages.map((text, index) => ({ id: `init-${index}-${Date.now()}`, sender: "victim", text, time: currentTime(), unread: false }));
}

function initialCoach(scenario) {
  return {
    current_emotion: "불안과 두려움을 느끼는 상태",
    advice_tip: `${scenario.name}의 피해 상황을 듣고 감정을 먼저 인정해 주세요.`,
    suggested_replies: getSuggestedReplies(scenario),
  };
}

export default function ChatPageClient({ initialScenarioId }) {
  const router = useRouter();
  const wallet = useHeartWallet();
  const { status, user, profile, openingCompleted } = useCloudSession();
  const userProfile = useRef(getStoredProfile());
  useEffect(() => {
    if (status !== "ready") return;
    if (!user || user.isAnonymous) router.replace("/");
    else if (!profile && !getStoredProfile()) router.replace("/my");
    else if (!openingCompleted) router.replace("/opening");
  }, [openingCompleted, profile, router, status, user]);
  const initialScenario = SCENARIOS.find((scenario) => scenario.id === initialScenarioId);
  const scenarioId = initialScenario.id;
  const currentScenario = initialScenario;
  const isClient = useSyncExternalStore(subscribeToMount, getClientSnapshot, getServerSnapshot);
  const [savedSession] = useState(() => readSavedChat(scenarioId));
  const [messages, setMessages] = useState(() => savedSession?.messages || initialMessages(initialScenario));
  const [isTyping, setIsTyping] = useState(false);
  const [dialogueScore, setDialogueScore] = useState(() => Number.isFinite(savedSession?.dialogueScore) ? clampScore(savedSession.dialogueScore) : INITIAL_COMFORT);
  const itemBonus = wallet.scenarioBoosts[scenarioId] || 0;
  const comfortScore = clampScore(dialogueScore + itemBonus);
  const [turnCount, setTurnCount] = useState(() => Number.isSafeInteger(savedSession?.turnCount) && savedSession.turnCount >= 0 ? savedSession.turnCount : 0);
  const [coachData, setCoachData] = useState(() => savedSession?.coachData && typeof savedSession.coachData === "object" ? savedSession.coachData : initialCoach(initialScenario));
  const [reportData, setReportData] = useState(null);
  const [isLoadingReport, setIsLoadingReport] = useState(false);
  const [reportError, setReportError] = useState("");
  const [chatError, setChatError] = useState("");
  const [lastEarnedPoints, setLastEarnedPoints] = useState(0);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isBagModalOpen, setIsBagModalOpen] = useState(false);
  const [bagNotice, setBagNotice] = useState("");
  const [isSongGiftModalOpen, setIsSongGiftModalOpen] = useState(false);
  const [isSendingSong, setIsSendingSong] = useState(false);
  const [songGiftError, setSongGiftError] = useState("");
  const [isSongFormatPopupOpen, setIsSongFormatPopupOpen] = useState(false);
  const [inputValue, setInputValue] = useState(() => typeof savedSession?.inputValue === "string" ? savedSession.inputValue.slice(0, 2000) : "");
  const generation = useRef(0);
  const replyInFlight = useRef(false);
  const endingTimer = useRef(null);

  useEffect(() => () => clearTimeout(endingTimer.current), []);

  useEffect(() => {
    if (!isClient) return;
    try {
      localStorage.setItem(chatStorageKey(scenarioId), JSON.stringify({ messages, dialogueScore, turnCount, coachData, inputValue }));
      localStorage.setItem(chatDirtyKey(scenarioId), "1");
      window.dispatchEvent(new CustomEvent(CLOUD_SESSION_EVENT, { detail: { scenarioId } }));
    } catch { /* Chat continues when session storage is unavailable. */ }
  }, [isClient, scenarioId, messages, dialogueScore, turnCount, coachData, inputValue]);

  const handleSelectScenario = (newId) => {
    generation.current += 1;
    setIsScenarioModalOpen(false);
    router.push(`/chat?scenario=${encodeURIComponent(newId)}`);
  };

  const handleSendMessage = async (text) => {
    if (isTyping || replyInFlight.current) return;
    replyInFlight.current = true;
    const requestGeneration = generation.current;
    const userMessage = { id: `user-${crypto.randomUUID()}`, sender: "user", text, time: currentTime(), unread: true };
    const nextMessages = [...messages, userMessage].slice(-80);
    setMessages(nextMessages);
    setChatError("");
    setLastEarnedPoints(0);
    setIsTyping(true);
    try {
      const coachResponse = await fetch("/api/coach", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, messages: nextMessages, previousScore: comfortScore }),
      });
      if (!coachResponse.ok) {
        const failure = await coachResponse.json().catch(() => null);
        throw new Error(failure?.error || "응대 평가에 실패했습니다.");
      }
      const assessment = await coachResponse.json();
      if (requestGeneration !== generation.current) return;
      const evaluatedMessages = nextMessages.map((message) => message.id === userMessage.id ? { ...message, evaluation: { turn_delta: assessment.turn_delta, evidence: assessment.evidence, feedback: assessment.feedback } } : message);
      const chatResponse = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, messages: evaluatedMessages, evaluation: assessment, userProfile: userProfile.current }),
      });
      if (!chatResponse.ok) {
        const failure = await chatResponse.json().catch(() => null);
        throw new Error(failure?.error || "친구의 답장을 불러오지 못했습니다.");
      }
      const chat = await chatResponse.json();
      if (requestGeneration !== generation.current) return;
      setDialogueScore(assessment.comfort_score - itemBonus);
      setCoachData(assessment);
      const earnedPoints = pointsForScoreIncrease(comfortScore, assessment.comfort_score);
      if (earnedPoints > 0 && awardHeartPoints(earnedPoints)) setLastEarnedPoints(earnedPoints);
      const victimMessage = { id: `victim-${crypto.randomUUID()}`, sender: "victim", text: chat.reply, time: currentTime(), unread: false };
      setMessages([...evaluatedMessages.map((message) => ({ ...message, unread: false })), victimMessage].slice(-80));
      setTurnCount((count) => count + 1);
    } catch (error) {
      if (requestGeneration === generation.current) {
        setMessages(messages);
        setInputValue(text);
        setChatError(error.message);
      }
    } finally {
      replyInFlight.current = false;
      if (requestGeneration === generation.current) setIsTyping(false);
    }
  };

  const requestGiftReply = async (giftMessages) => {
    if (replyInFlight.current) return;
    replyInFlight.current = true;
    const requestGeneration = generation.current;
    const giftId = giftMessages.at(-1)?.id;
    setChatError("");
    setIsTyping(true);
    try {
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, messages: giftMessages, userProfile: userProfile.current }),
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        throw new Error(failure?.error || "선물에 대한 친구의 답장을 불러오지 못했습니다.");
      }
      const chat = await response.json();
      if (requestGeneration !== generation.current) return;
      const victimMessage = { id: `victim-${crypto.randomUUID()}`, sender: "victim", text: chat.reply, time: currentTime(), unread: false };
      setMessages((current) => current.at(-1)?.id === giftId ? [...current, victimMessage].slice(-80) : current);
    } catch (error) {
      if (requestGeneration === generation.current) setChatError(`선물은 전달됐어요. ${error.message} 아래에서 답장을 다시 받을 수 있어요.`);
    } finally {
      replyInFlight.current = false;
      if (requestGeneration === generation.current) setIsTyping(false);
    }
  };

  const handleOpenReportModal = async () => {
    const requestGeneration = generation.current;
    setIsReportModalOpen(true);
    setIsLoadingReport(true);
    setReportError("");
    setReportData(null);
    try {
      const response = await fetch("/api/report", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, messages, itemBonus }),
      });
      if (!response.ok) throw new Error("리포트를 생성하지 못했습니다.");
      const report = await response.json();
      if (requestGeneration === generation.current) setReportData(report);
    } catch (error) {
      if (requestGeneration === generation.current) setReportError(error.message);
    } finally {
      if (requestGeneration === generation.current) setIsLoadingReport(false);
    }
  };

  const equippedTheme = SHOP_ITEMS.find((item) => item.id === wallet.equipped);

  const handleGiftItem = (itemId) => {
    if (isTyping || replyInFlight.current) { setBagNotice("친구의 답장을 기다린 뒤 선물해 주세요."); return; }
    const result = applyFantasyItem(itemId, scenarioId, comfortScore);
    setBagNotice(result.message);
    if (!result.ok) return;
    setLastEarnedPoints(0);
    const giftMessage = { id: `gift-${crypto.randomUUID()}`, sender: "system", giftItemId: result.item.id, giftBoost: result.applied, giftMatched: result.matched, text: `${currentScenario.name}에게 ${result.item.name}을(를) 선물했어요. ${result.reason}${result.applied > 0 ? ` 마음 안정도 +${result.applied}` : ""} · ${result.item.effect}`, time: currentTime() };
    const nextMessages = [...messages, giftMessage].slice(-80);
    setMessages(nextMessages);
    setIsBagModalOpen(false);
    void requestGiftReply(nextMessages);
  };

  const handleOpenSongGift = () => {
    if (isTyping || replyInFlight.current) return;
    if (!canReceiveSongGift(comfortScore)) {
      setMessages((current) => current.at(-1)?.sender === "victim" && current.at(-1)?.text === SONG_GIFT_REFUSAL
        ? current
        : [...current, { id: `victim-${crypto.randomUUID()}`, sender: "victim", text: SONG_GIFT_REFUSAL, time: currentTime(), unread: false }].slice(-80));
      return;
    }
    setSongGiftError("");
    setIsSongFormatPopupOpen(false);
    setIsSongGiftModalOpen(true);
  };

  const handleSendSongGift = async (file) => {
    if (replyInFlight.current || !file) return;
    if (!canReceiveSongGift(comfortScore)) {
      setIsSongGiftModalOpen(false);
      handleOpenSongGift();
      return;
    }
    if (!user?.uid || user.isAnonymous) {
      setSongGiftError("로그인한 뒤 악보 PDF를 선물해 주세요.");
      return;
    }
    replyInFlight.current = true;
    const requestGeneration = generation.current;
    setIsSendingSong(true);
    setIsTyping(true);
    setSongGiftError("");
    try {
      const pages = await renderSongPdf(file);
      const response = await fetch("/api/song-gift", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioId, messages, userProfile: userProfile.current, comfortScore, pages }),
      });
      if (!response.ok) {
        const failure = await response.json().catch(() => null);
        const error = new Error(failure?.error || "악보의 편지와 가사를 읽지 못했어요.");
        error.code = failure?.code;
        throw error;
      }
      const song = await response.json();
      if (requestGeneration !== generation.current) return;
      const fileId = `song-${crypto.randomUUID()}`;
      await saveSongPdf({ uid: user.uid, fileId, scenarioId, file });
      if (requestGeneration !== generation.current) return;
      const giftMessage = {
        id: `song-gift-${crypto.randomUUID()}`,
        sender: "system",
        text: `${currentScenario.name}에게 직접 만든 노래 '${song.title}'의 악보 PDF를 선물했어요.`,
        songGift: { title: song.title, letter: song.letter, lyrics: song.lyrics, fileName: file.name, fileId, suitable: song.suitable === true },
        time: currentTime(),
      };
      const victimMessage = song.suitable && song.reply
        ? { id: `victim-${crypto.randomUUID()}`, sender: "victim", text: song.reply, time: currentTime(), unread: false }
        : null;
      setMessages((current) => [...current, giftMessage, ...(victimMessage ? [victimMessage] : [])].slice(-80));
      setIsSongGiftModalOpen(false);
      if (victimMessage) {
        endingTimer.current = setTimeout(() => router.push(`/ending?scenario=${encodeURIComponent(scenarioId)}`), 4000);
      }
    } catch (error) {
      if (requestGeneration === generation.current) {
        if (error.code === "INVALID_SONG_FORMAT") {
          setIsSongGiftModalOpen(false);
          setIsSongFormatPopupOpen(true);
        } else setSongGiftError(error.message);
      }
    } finally {
      replyInFlight.current = false;
      if (requestGeneration === generation.current) {
        setIsTyping(false);
        setIsSendingSong(false);
      }
    }
  };

  const handleDownloadSongPdf = async (fileId) => {
    try {
      await downloadSongPdf({ uid: user?.uid, fileId, scenarioId });
    } catch (error) {
      setChatError(error.message);
    }
  };

  const pendingGiftReply = messages.at(-1)?.sender === "system" && messages.at(-1)?.giftItemId;

  if (!isClient) return null;

  return (
    <main className={`chat-workspace ${isDrawerOpen ? "assistant-visible" : ""}`}>
      <section className="app-container chat-pane" aria-label={`${currentScenario.name}와의 채팅`} style={equippedTheme ? { background: equippedTheme.background } : undefined}>
        <KakaoHeader currentScenario={currentScenario} comfortScore={comfortScore} heartPoints={wallet.balance} pointsEarned={lastEarnedPoints} onOpenScenarioModal={() => setIsScenarioModalOpen(true)} onOpenDrawer={() => setIsDrawerOpen((value) => !value)} onOpenBag={() => { setBagNotice(""); setIsBagModalOpen(true); }} onOpenShop={() => router.push("/shop")} drawerOpen={isDrawerOpen} onBack={() => router.push("/chat")} />
        <ChatList messages={messages} isTyping={isTyping} currentScenario={currentScenario} onDownloadSongPdf={handleDownloadSongPdf} />
        {chatError && <p role="alert" style={{ padding: "6px 14px", color: "#A22", fontSize: "12px" }}>{chatError}</p>}
        {pendingGiftReply && !isTyping && <button type="button" className="gift-reply-retry" onClick={() => requestGiftReply(messages)}>선물에 대한 답장 다시 받기</button>}
        <ChatInput onSendMessage={handleSendMessage} isTyping={isTyping} turnCount={turnCount} comfortScore={comfortScore} onOpenReportModal={handleOpenReportModal} inputValue={inputValue} setInputValue={setInputValue} onOpenDrawer={() => setIsDrawerOpen(true)} onOpenGift={() => { setBagNotice(""); setIsBagModalOpen(true); }} onOpenSongGift={handleOpenSongGift} />
        <ScenarioModal isOpen={isScenarioModalOpen} onClose={() => setIsScenarioModalOpen(false)} selectedScenarioId={scenarioId} onSelectScenario={handleSelectScenario} />
        <ReportModal key={`${scenarioId}:${messages.at(-1)?.id}`} isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} reportData={reportData} isLoadingReport={isLoadingReport} reportError={reportError} currentScenario={currentScenario} messages={messages} />
        <ItemBagModal isOpen={isBagModalOpen} onClose={() => setIsBagModalOpen(false)} wallet={wallet} currentScenario={currentScenario} currentComfort={comfortScore} onGiftItem={handleGiftItem} onOpenShop={() => router.push("/shop")} notice={bagNotice} />
        {isSongGiftModalOpen && <SongGiftModal isOpen onClose={() => setIsSongGiftModalOpen(false)} onSend={handleSendSongGift} isSending={isSendingSong} error={songGiftError} currentScenario={currentScenario} />}
        {isSongFormatPopupOpen && <div className="modal-overlay" role="presentation"><div className="modal-box song-format-popup" role="alertdialog" aria-modal="true" aria-labelledby="song-format-title" aria-describedby="song-format-description"><div className="song-format-popup-icon" aria-hidden="true">📄</div><h3 id="song-format-title">양식에 맞지 않는 파일이에요</h3><p id="song-format-description">{SONG_FORMAT_ERROR}</p><button type="button" onClick={() => setIsSongFormatPopupOpen(false)}>확인</button></div></div>}
      </section>
      <AssistantDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} coachData={coachData} isLoadingCoach={isTyping} onSelectSuggestedReply={setInputValue} currentScenario={currentScenario} />
    </main>
  );
}
