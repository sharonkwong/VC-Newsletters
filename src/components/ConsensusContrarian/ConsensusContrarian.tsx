import React from "react";
import { Eye, AlertTriangle, Shield } from "lucide-react";
import { COLORS, FONTS } from "../../constants/constants";
import type { ViewPoint } from "../../types/types";
import SectionCard from "../SectionCard/SectionCard";
import styles from "./ConsensusContrarian.module.css";

interface ConsensusContrarianProps {
  consensus: ViewPoint[];
  contrarian: ViewPoint[];
}

const ConsensusContrarian: React.FC<ConsensusContrarianProps> = ({ consensus, contrarian }) => {
  return (
    <SectionCard title="Consensus vs. Contrarian Views" icon={<Eye size={20} />}>
      <div className={styles.columns}>
        <div className={styles.column}>
          <h4
            className={styles.columnTitle}
            style={{
              color: COLORS.status.info,
              borderBottomColor: COLORS.status.info,
              fontFamily: FONTS.heading,
            }}
          >
            <Shield size={16} />
            Consensus Views
          </h4>
          {consensus.map((vp, i) => (
            <div
              key={i}
              className={styles.viewpoint}
              style={{ backgroundColor: COLORS.status.infoBg, borderLeft: "none" }}
            >
              <h5 className={styles.viewpointTitle} style={{ color: COLORS.black, fontFamily: FONTS.body }}>
                {vp.title}
              </h5>
              <p className={styles.viewpointDesc} style={{ color: COLORS.gray[600], fontFamily: FONTS.body }}>
                {vp.description}
              </p>
            </div>
          ))}
        </div>
        <div className={styles.column}>
          <h4
            className={styles.columnTitle}
            style={{
              color: COLORS.status.warning,
              borderBottomColor: COLORS.status.warning,
              fontFamily: FONTS.heading,
            }}
          >
            <AlertTriangle size={16} />
            Contrarian Views
          </h4>
          {contrarian.map((vp, i) => (
            <div
              key={i}
              className={styles.viewpoint}
              style={{ backgroundColor: COLORS.status.warningBg, borderLeft: "none" }}
            >
              <h5 className={styles.viewpointTitle} style={{ color: COLORS.black, fontFamily: FONTS.body }}>
                {vp.title}
              </h5>
              <p className={styles.viewpointDesc} style={{ color: COLORS.gray[600], fontFamily: FONTS.body }}>
                {vp.description}
              </p>
            </div>
          ))}
        </div>
      </div>
      <div className={styles.vcInsight} style={{ backgroundColor: COLORS.secondary }}>
        <p style={{ color: COLORS.gray[500], fontFamily: FONTS.body }}>
          <strong style={{ color: COLORS.black }}>VC Insight:</strong> Pay special attention to contrarian signals that challenge the mainstream narrative — these often
          indicate early-stage opportunities before market consensus shifts.
        </p>
      </div>
    </SectionCard>
  );
};

export default ConsensusContrarian;
