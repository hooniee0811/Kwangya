"use client";

import React, { useState } from "react";
import styled from "styled-components";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import TableContainer from "@mui/material/TableContainer";
import Table from "@mui/material/Table";
import TableRow from "@mui/material/TableRow";
import TableCell from "@mui/material/TableCell";
import TableHead from "@mui/material/TableHead";
import TableBody from "@mui/material/TableBody";
import Tooltip from "@mui/material/Tooltip";
import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import Alert from "@mui/material/Alert";
import Avatar from "@mui/material/Avatar";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import LockIcon from "@mui/icons-material/Lock";

import phaserGame from "../PhaserGame";
import Bootstrap from "../_scenes/Bootstrap";
import { useRoomStore } from "../_stores/use-room";
import { getAvatarString, getColorByString } from "./util";
import { useAppSelector } from "../hooks";

const MessageText = styled.p`
  margin: 10px;
  font-size: 18px;
  color: #eee;
  text-align: center;
`;

const CustomRoomTableContainer = styled(TableContainer)<{
  component: React.ElementType;
}>`
  max-height: 500px;

  table {
    min-width: 650px;
  }
`;

const TableRowWrapper = styled(TableRow)`
  &:last-child td,
  &:last-child th {
    border: 0;
  }

  .avatar {
    height: 30px;
    width: 30px;
    font-size: 15px;
  }

  .name {
    min-width: 100px;
    overflow-wrap: anywhere;
  }

  .description {
    min-width: 200px;
    overflow-wrap: anywhere;
  }

  .join-wrapper {
    display: flex;
    gap: 3px;
    align-items: center;
  }

  .lock-icon {
    font-size: 18px;
  }
`;

const PasswordDialog = styled(Dialog)`
  .dialog-content {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .MuiDialog-paper {
    background: #222639;
  }
`;

interface CustomRoomProps {
  setLoginPage: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CustomRoomTable = ({ setLoginPage }: CustomRoomProps) => {
  const [password, setPassword] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [showPasswordError, setShowPasswordError] = useState(false);
  const [passwordFieldEmpty, setPasswordFieldEmpty] = useState(false);

  const lobbyJoined = useAppSelector((state) => state.room.lobbyJoined);
  const availableRooms = useAppSelector((state) => state.room.availableRooms);

  const handleJoinClick = (roomId: string, password: string | null) => {
    if (!lobbyJoined) return;
    const bootstrap = phaserGame.scene.keys.bootstrap as Bootstrap;
    bootstrap.network
      .joinCustomById(roomId, password)
      .then(() => {
        bootstrap.launchGame();
        setLoginPage(true);
      })
      .catch((error) => {
        console.error(error);
        if (password) {
          setShowPasswordError(true);
        }
        return;
      });
  };

  const handlePasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isValidPassword = password !== "";

    if (isValidPassword === passwordFieldEmpty)
      setPasswordFieldEmpty(!passwordFieldEmpty);
    if (isValidPassword) handleJoinClick(selectedRoom, password);
  };

  const resetPasswordDialog = () => {
    setShowPasswordDialog(false);
    setPassword("");
    setPasswordFieldEmpty(false);
    setShowPasswordError(false);
  };

  return availableRooms.length === 0 ? (
    <MessageText>
      There are no custom rooms now, create one and join.
    </MessageText>
  ) : (
    <>
      <CustomRoomTableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>ID</TableCell>
              <TableCell align="center">
                <PeopleAltIcon />
              </TableCell>
              <TableCell align="right"></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {availableRooms.map((room) => {
              const { roomId, metadata, clients } = room;
              const { name, description, passwordBeingUsed } = metadata;
              console.log(room);
              return (
                <TableRowWrapper key={roomId}>
                  <TableCell>
                    <Avatar
                      className="avatar"
                      style={{ background: getColorByString(name) }}
                    >
                      {getAvatarString(name)}
                    </Avatar>
                  </TableCell>
                  <TableCell>
                    <div className="name">{name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="description">{description}</div>
                  </TableCell>
                  <TableCell>{roomId}</TableCell>
                  <TableCell align="center">{clients}</TableCell>
                  <TableCell align="center">
                    <Tooltip
                      title={passwordBeingUsed ? "Password required" : ""}
                    >
                      <Button
                        variant="outlined"
                        style={{ color: "black", borderColor: "lightblue" }}
                        onClick={() => {
                          console.log(passwordBeingUsed);
                          if (passwordBeingUsed) {
                            setShowPasswordDialog(true);
                            setSelectedRoom(roomId);
                          } else {
                            handleJoinClick(roomId, null);
                          }
                        }}
                      >
                        <div className="join-wrapper">
                          {passwordBeingUsed && (
                            <LockIcon className="lock-icon" />
                          )}
                          Join
                        </div>
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRowWrapper>
              );
            })}
          </TableBody>
        </Table>
      </CustomRoomTableContainer>
      <PasswordDialog open={showPasswordDialog} onClose={resetPasswordDialog}>
        <form onSubmit={handlePasswordSubmit}>
          <DialogContent className="dialog-content">
            <MessageText>
              This a private room, please enter password:
            </MessageText>
            <TextField
              autoFocus
              fullWidth
              error={passwordFieldEmpty}
              helperText={passwordFieldEmpty && "Required"}
              value={password}
              label="Password"
              type="password"
              variant="outlined"
              InputProps={{ style: { color: "white" } }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  "& fieldset": {
                    borderColor: "lightblue",
                  },
                  "&:hover fieldset": {
                    borderColor: "lightblue",
                  },
                  "&.Mui-focused fieldset": {
                    borderColor: "lightblue",
                  },
                },
                "& .MuiInputLabel-root": {
                  color: "white",
                },
                "& .MuiInputLabel-root.Mui-focused": {
                  color: "white",
                },
              }}
              onInput={(e) => {
                setPassword((e.target as HTMLInputElement).value);
              }}
            />
            {showPasswordError && (
              <Alert severity="error" variant="outlined">
                Incorrect Password!
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button
              variant="outlined"
              style={{ color: "white", borderColor: "lightblue" }}
              onClick={resetPasswordDialog}
            >
              Cancel
            </Button>
            <Button
              variant="outlined"
              style={{ color: "white", borderColor: "lightblue" }}
              type="submit"
            >
              Join
            </Button>
          </DialogActions>
        </form>
      </PasswordDialog>
    </>
  );
};
