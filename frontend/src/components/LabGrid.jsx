import React from 'react';
import {
  Box,
  Card,
  Typography,
  Button,
  Dialog
} from '@mui/material';

import { motion } from 'motion/react';

import {
  MdChevronRight,
  MdAccessTime,
  MdStars,
  MdWarning
} from 'react-icons/md';

import { useLabStore } from '../store/labStore';
import { useAuthStore } from '../store/authStore';

import { useNavigate, Link } from 'react-router-dom';

import {
  stopLabSession,
  startLabSession,
  waitForLabSessionReady,
  fetchUserActiveSession
} from '../services/labService';

import PaymentGateway from './PaymentGateway';
import SessionTimeoutModal from './SessionTimeoutModal.jsx';

const LabGrid = ({ onLabClick, labs: labsProp, readOnly = false }) => {

  const navigate = useNavigate();

  const { labs: storeLabs } = useLabStore();

  const { user, updateUser } = useAuthStore();

  const labs = labsProp || storeLabs;

  const [activeSessions, setActiveSessions] = React.useState({});

  const [isStopping, setIsStopping] = React.useState(null);

  const [showStopModal, setShowStopModal] = React.useState(false);

  const [showCreditModal, setShowCreditModal] = React.useState(null);

  const [isPaymentOpen, setIsPaymentOpen] = React.useState(false);

  const [pendingStop, setPendingStop] = React.useState(null);

  const [elapsedTimes, setElapsedTimes] = React.useState({});

  const [showWarningModal, setShowWarningModal] = React.useState(false);

  const [startingLabId, setStartingLabId] = React.useState(null);

  const [startError, setStartError] = React.useState('');

  // =========================
  // CHECK ACTIVE SESSION
  // =========================

  React.useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const checkActiveSession = async () => {
      try {
        const response = await fetchUserActiveSession(user.id);
        if (mounted && response.session) {
          setActiveSessions({
            [response.session.labId]: response.session
          });
        }
      } catch (err) {
        console.error('Failed to load active session:', err);
      }
    };

    checkActiveSession();

    return () => {
      mounted = false;
    };
  }, [user?.id]);


  // =========================
  // TIMER
  // =========================

  React.useEffect(() => {

    const timer = setInterval(() => {

      const newTimes = {};

      Object.entries(activeSessions).forEach(([labId, session]) => {

        if (session.status === 'running' && session.startedAt) {

          const diff = Math.floor(
            (new Date() - new Date(session.startedAt)) / 1000
          );

          const mins = Math.floor(diff / 60);

          const secs = diff % 60;

          newTimes[labId] =
            `${mins}:${secs.toString().padStart(2, '0')}`;
        }
      });

      setElapsedTimes(newTimes);

    }, 1000);

    return () => clearInterval(timer);

  }, [activeSessions]);

  // =========================
  // STOP LAB
  // =========================

  const handleStopLab = async () => {

    if (!pendingStop) return;

    const { sessionId, labId } = pendingStop;

    setIsStopping(labId);

    setShowStopModal(false);

    try {

      await stopLabSession(sessionId);

    } catch (err) {

      console.error('Failed to stop lab:', err);

    } finally {

      setActiveSessions({});

      setIsStopping(null);

      setPendingStop(null);

      // No need to re-check sessions after stopping.

    }
  };

  // =========================
  // LIVE CREDIT DEDUCTION
  // =========================

  React.useEffect(() => {

    if (!user) return;

    const runningSessions = Object.values(activeSessions).filter(
      s => s.status === 'running' && s.startedAt
    );

    if (runningSessions.length === 0) return;

    const deductionInterval = setInterval(() => {

      runningSessions.forEach(session => {

        const lab = labs.find(l => l.id === session.labId);

        if (lab && lab.credits > 0 && lab.durationMinutes > 0) {

          const costPerMinute =
            lab.credits / lab.durationMinutes;

          updateUser({
            credits: Math.max(
              0,
              (user.credits || 0) - costPerMinute
            )
          });
        }
      });

    }, 60000);

    return () => clearInterval(deductionInterval);

  }, [user, activeSessions, labs, updateUser]);

  // =========================
  // START LAB
  // =========================

  const openLabSession = (lab, session) => {

    navigate(
      `/admin/compute/rdp?labId=${lab.id}&sessionId=${session?.sessionId || ''}`
    );
  };

  const handleStartClick = async (e, lab) => {
    e?.stopPropagation?.();
    e?.preventDefault?.();

    setStartError('');

    if (!user) {
      setStartError('Please log in again to start a lab.');
      return;
    }

    const labId = lab?.id;
    if (!labId) {
      setStartError('Invalid lab configuration (missing lab id).');
      return;
    }

    const isAdmin = user.role === 'Super Admin' || user.role === 'Tenant Admin';
    const userCredits = Number(user.credits ?? 0);
    const labCost = Number(lab.credits ?? 0);

    if (!isAdmin && labCost > 0 && userCredits < labCost) {
      setShowCreditModal(lab);
      setIsPaymentOpen(true);
      return;
    }

    const otherActiveSession = Object.keys(activeSessions).find(
      (id) => id !== labId
    );

    if (otherActiveSession) {
      setShowWarningModal(true);
      return;
    }

    setStartingLabId(labId);

    try {
      const startResponse = await startLabSession({ labId });

      const sessionId = startResponse.sessionId;
      if (!sessionId) {
        throw new Error('No session id returned from server');
      }

      const readySession = await waitForLabSessionReady(sessionId);

      setActiveSessions({
        [labId]: readySession
      });

      openLabSession(lab, readySession);
    } catch (err) {
      const message = err?.message || 'Failed to start lab';
      setStartError(message);
      console.error('Failed to start lab:', err);
    } finally {
      setStartingLabId(null);
    }
  };

  const isLabActive = (labId) =>
    !!activeSessions[labId];

  return (
    <>
      {startError ? (
        <Box className="mb-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium">
          {startError}
        </Box>
      ) : null}

      <Box className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">

        {labs.map((lab, idx) => (

          <motion.div
            key={lab.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ y: -8 }}
            onClick={() => onLabClick(lab)}
            className="cursor-pointer group"
          >

            <Card
              elevation={0}
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:border-red-500/30 hover:shadow-xl hover:shadow-slate-200/50 transition-all p-6 h-full flex flex-col"
            >

              <div className="flex flex-col h-full gap-5">

                {/* LOGO */}

                <div className="w-40 aspect-square mx-auto rounded-xl flex items-center justify-center bg-slate-50 border border-slate-200 relative overflow-hidden shrink-0 group-hover:bg-white transition-colors">

                  <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(220,38,38,0.05)_0%,transparent_70%)] opacity-0 group-hover:opacity-100 transition-opacity" />

                  <img
                    src={lab.logo}
                    alt={lab.title}
                    className="max-h-[60%] max-w-[60%] object-contain transition-transform duration-[1200ms] group-hover:scale-110 relative z-10"
                    referrerPolicy="no-referrer"
                  />
                </div>

                {/* CONTENT */}

                <div className="flex-1 flex flex-col">

                  <Typography
                    variant="h6"
                    className="text-slate-900 font-black tracking-tight text-xl group-hover:text-red-600 transition-colors line-clamp-2"
                  >
                    {lab.title}
                  </Typography>

                  <div className="flex flex-wrap items-center gap-2 mt-4">

                    {/* TIME */}

                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">

                      <MdAccessTime
                        size={14}
                        className={
                          isLabActive(lab.id)
                            ? "text-emerald-500"
                            : "text-slate-400"
                        }
                      />

                      <div className="flex items-center gap-1.5">

                        <Typography className="text-[9px] text-slate-400 font-black uppercase tracking-widest">

                          {isLabActive(lab.id)
                            ? 'Running:'
                            : 'Time:'}

                        </Typography>

                        <Typography
                          className={`text-[10px] font-bold ${
                            isLabActive(lab.id)
                              ? 'text-emerald-600'
                              : 'text-slate-700'
                          }`}
                        >

                          {elapsedTimes[lab.id] ||
                            `${lab.durationMinutes}m`}

                        </Typography>
                      </div>
                    </div>

                    {/* CREDITS */}

                    <div className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 rounded-lg border border-slate-100">

                      <MdStars
                        size={14}
                        className="text-slate-400"
                      />

                      <div className="flex items-center gap-1.5">

                        <Typography className="text-[9px] text-slate-400 font-black uppercase tracking-widest">

                          Credits:

                        </Typography>

                        <Typography className="text-[10px] font-bold text-slate-700">

                          {(isLabActive(lab.id)
                            ? user?.credits
                            : lab.credits) || 0}

                        </Typography>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ACTIONS */}

                {!readOnly ? (

                  <div className="flex flex-col gap-3 pt-4 border-t border-slate-100">

                    {isLabActive(lab.id) ? (

                      <div className="flex flex-col gap-2">

                        <Link
                          to={`/admin/compute/rdp?labId=${lab.id}&sessionId=${activeSessions[lab.id]?.sessionId || ''}`}
                          onClick={(e) =>
                            e.stopPropagation()
                          }
                          className="w-full"
                          style={{
                            textDecoration: 'none'
                          }}
                        >

                          <Button
                            variant="contained"
                            fullWidth
                            className="!bg-emerald-600 hover:!bg-emerald-700 text-white rounded-xl py-3 font-black text-xs tracking-widest uppercase"
                          >

                            Go to Lab

                          </Button>

                        </Link>

                        {/* STOP BUTTON */}

                        <Button
                          variant="contained"
                          onClick={(e) => {

                            e.stopPropagation();

                            setPendingStop({
                              sessionId:
                                activeSessions[lab.id]
                                  .sessionId,
                              labId: lab.id
                            });

                            setShowStopModal(true);
                          }}
                          disabled={
                            isStopping === lab.id
                          }
                          fullWidth
                          className="!bg-red-600 hover:!bg-red-700 text-white rounded-xl py-3 font-black text-xs tracking-widest uppercase"
                        >

                          {isStopping === lab.id
                            ? 'Stopping...'
                            : 'Stop Lab'}

                        </Button>
                      </div>

                    ) : (

                      <Button
                        variant="contained"
                        fullWidth
                        disabled={startingLabId === lab.id}
                        onClick={(e) =>
                          handleStartClick(e, lab)
                        }
                        className="!bg-red-600 hover:!bg-red-700 text-white rounded-xl py-4 font-black text-xs tracking-widest uppercase"
                        endIcon={
                          <MdChevronRight size={20} />
                        }
                      >

                        {startingLabId === lab.id
                          ? 'Starting Lab...'
                          : 'Start Lab'}

                      </Button>
                    )}
                  </div>

                ) : null}
              </div>
            </Card>
          </motion.div>
        ))}
      </Box>

      {/* STOP MODAL */}

      <Dialog
        open={showStopModal}
        onClose={() =>
          !isStopping &&
          setShowStopModal(false)
        }
      >

        <Box className="p-6 flex flex-col items-center gap-4 text-center max-w-sm">

          <Box className="w-16 h-16 rounded-full bg-red-600/10 flex items-center justify-center text-red-500 mb-2">

            <MdWarning size={32} />

          </Box>

          <Typography className="text-black text-xl font-black">

            Stop Lab Session?

          </Typography>

          <Typography className="text-slate-500 text-sm">

            Are you sure you want to stop this lab?

          </Typography>

          <Box className="flex gap-3 w-full mt-4">

            <Button
              onClick={() =>
                setShowStopModal(false)
              }
              className="flex-1"
            >
              Cancel
            </Button>

            <Button
              onClick={handleStopLab}
              variant="contained"
              className="flex-1 !bg-red-600"
            >
              Stop
            </Button>

          </Box>
        </Box>
      </Dialog>

      {/* WARNING MODAL */}

      <Dialog
        open={showWarningModal}
        onClose={() =>
          setShowWarningModal(false)
        }
      >

        <Box className="p-6 text-center">

          <Typography className="font-black text-lg">

            Active Session Found

          </Typography>

          <Typography className="mt-2 text-sm">

            First stop current lab.

          </Typography>

          <Button
            className="mt-4"
            variant="contained"
            onClick={() =>
              setShowWarningModal(false)
            }
          >

            OK

          </Button>
        </Box>
      </Dialog>

      {/* PAYMENT */}

      <PaymentGateway
        open={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setShowCreditModal(null);
        }}
        lab={showCreditModal ? { ...showCreditModal, name: showCreditModal.title || showCreditModal.name } : null}
        initialAmount={
          showCreditModal?.credits || 50
        }
        onPaymentSuccess={(lab, amount) => {

          updateUser({
            credits:
              (user?.credits || 0) + amount
          });

          navigate(
            `/admin/compute/rdp?labId=${lab.id}`
          );
        }}
      />

      <SessionTimeoutModal session={Object.values(activeSessions)[0] || null} />
    </>
  );
};

export default LabGrid;
