import { Button } from "@/components/ui/button";
import { useEffect, useRef } from "react";
import phaserGame from "../PhaserGame";
import Game from "../_scenes/Game";
import Bootstrap from "../_scenes/Bootstrap";
import styled from "styled-components";

const Video = styled.div`
  .video-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, 160px);
    grid-gap: 5px;
    grid-auto-rows: 160px;
    position: absolute;
    top: 35px;
    right: 10px;
    max-height: calc(100% - 100px);
    overflow-y: auto;
  }

  .video-grid video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 5px;
    border: 1px groove rgb(229, 251, 255);
  }
`;

export const UserVideo = () => {
  return (
    <>
      <Video className="video-grid" />
    </>
  );
};