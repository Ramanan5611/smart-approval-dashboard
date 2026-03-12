import React from 'react';
import { RequestStage, RequestStatus } from '../types';
import { STAGE_ORDER, STAGE_LABELS } from '../constants';
import { CheckCircle, Circle, XCircle } from 'lucide-react';

interface Props {
  currentStage: RequestStage;
  status: RequestStatus;
  requestType?: string;
}

const ProgressBar: React.FC<Props> = ({ currentStage, status, requestType }) => {
  const currentIndex = STAGE_ORDER.indexOf(currentStage);

  // Compute stages based on request type
  // Mail ID Unblock: goes straight to Student Affairs — no Faculty/HOD review needed
  // OD / Leave / General: full chain Faculty → HOD → Student Affairs
  const displayStages: RequestStage[] = requestType === 'mailid'
    ? [RequestStage.STUDENT_AFFAIRS_APPROVAL]
    : [RequestStage.FACULTY_REVIEW, RequestStage.HOD_REVIEW, RequestStage.STUDENT_AFFAIRS_APPROVAL];

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded"></div>

        {displayStages.map((stage, idx) => {
          const stageIndex = STAGE_ORDER.indexOf(stage);
          let state: 'upcoming' | 'current' | 'completed' | 'rejected' = 'upcoming';

          if (status === RequestStatus.REJECTED && stageIndex === currentIndex) {
            state = 'rejected';
          } else if (stageIndex < currentIndex || (status === RequestStatus.APPROVED && stage === RequestStage.STUDENT_AFFAIRS_APPROVAL)) {
            state = 'completed';
          } else if (stageIndex === currentIndex && status === RequestStatus.PENDING) {
            state = 'current';
          }

          return (
            <div key={stage} className="flex flex-col items-center bg-white px-2">
              {state === 'completed' && <CheckCircle className="w-8 h-8 text-green-500 fill-white" />}
              {state === 'current' && <Circle className="w-8 h-8 text-blue-500 fill-blue-50 animate-pulse" />}
              {state === 'rejected' && <XCircle className="w-8 h-8 text-red-500 fill-white" />}
              {state === 'upcoming' && <Circle className="w-8 h-8 text-slate-300 fill-white" />}

              <span className={`text-xs mt-2 font-medium ${state === 'current' ? 'text-blue-600' : 'text-slate-500'}`}>
                {STAGE_LABELS[stage]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProgressBar;