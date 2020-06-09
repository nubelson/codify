import React, { useEffect, useState, useCallback } from 'react';
import {
  FaPlayCircle,
  FaPauseCircle,
  FaSpotify,
  FaTimes,
} from 'react-icons/fa';
import { useTransition } from 'react-spring';
import { toast } from 'react-toastify';

import Modal from '../../../components/Modal';
import SpotifyButton from '../../../components/SpotifyButton';
import Spinner from '../../../components/Spinner';

import api from '../../../services/api';
import { playAudioWithFade, pauseAudioWithFade } from '../../../utils/audio';

import {
  Container,
  Info,
  Content,
  TracksList,
  Track,
  CloseModal,
} from './styles';

interface IModalProps {
  isOpen: boolean;
  setIsOpen: () => void;
  playlistId: string;
}

interface ITrack {
  id: string;
  name: string;
  preview: string;
  uri: string;
  artistName: string;
  albumImage: string;
  audio: HTMLAudioElement;
  playing: boolean;
}

interface IPlaylist {
  id: string;
  name: string;
  avatar: string;
  uri: string;
}

const ModalPlaylistTracks: React.FC<IModalProps> = ({
  isOpen,
  setIsOpen,
  playlistId,
}) => {
  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<ITrack[]>([]);
  const [playlist, setPlaylist] = useState<IPlaylist>({} as IPlaylist);
  const [mount, setMount] = useState(false);

  const handlePlay = useCallback(
    id => {
      setTracks(
        tracks.map(track =>
          track.id === id ? { ...track, playing: true } : track,
        ),
      );
    },
    [tracks],
  );

  const handlePause = useCallback(
    id => {
      setTracks(
        tracks.map(track =>
          track.id === id ? { ...track, playing: false } : track,
        ),
      );
    },
    [tracks],
  );

  useEffect(() => {
    async function loadPlaylist(): Promise<void> {
      try {
        const [playlistResponse, tracksResponse] = await Promise.all([
          api.get(`/playlist/${playlistId}`),
          api.get(`/playlist/tracks/${playlistId}`),
        ]);

        const tracksData = tracksResponse.data.map((track: ITrack) => ({
          ...track,
          audio: new Audio(`${track.preview}`),
          playing: false,
        }));

        setPlaylist(playlistResponse.data);
        setTracks(tracksData);
        setTimeout(() => {
          setMount(true);
        }, 10);
      } catch (err) {
        toast.error(err.response.data.error);
      } finally {
        setLoading(false);
      }
    }

    loadPlaylist();
  }, [playlistId]);

  const tracksWithTransition = useTransition(tracks, track => track.id, {
    from: {
      opacity: 0,
      transform: 'scale(0.8)',
    },
    enter: {
      opacity: 1,
      transform: 'scale(1)',
    },
    trail: 100,
  });

  return (
    <Modal isOpen={isOpen} setIsOpen={setIsOpen}>
      <Container>
        {loading ? (
          <Spinner width={48} height={48} />
        ) : (
          <>
            <Info mount={mount}>
              <img src={playlist.avatar} alt={playlist.name} />
              <SpotifyButton href={playlist.uri}>
                Abrir no Spotify
              </SpotifyButton>
            </Info>

            <Content>
              <h1>{playlist.name}</h1>
              <TracksList>
                {tracksWithTransition.map(({ item, key, props }, index) => (
                  <Track
                    key={key}
                    style={props}
                    isPlaying={item.playing}
                    mount={mount}
                  >
                    <img src={item.albumImage} alt={item.name} />
                    <div>
                      <strong>
                        {index + 1}. {item.name}
                      </strong>
                      <span>{item.artistName}</span>
                    </div>

                    <aside>
                      <button
                        type="button"
                        className="pauseButton"
                        onClick={() => {
                          pauseAudioWithFade(item.audio, 100);
                          handlePause(item.id);
                        }}
                      >
                        <FaPauseCircle size={24} color="#33ff7a" />
                      </button>
                      <button
                        type="button"
                        className="playButton"
                        onClick={() => {
                          playAudioWithFade(item.audio, 100);
                          handlePlay(item.id);
                        }}
                      >
                        <FaPlayCircle size={24} color="#33ff7a" />
                      </button>

                      <a href={item.uri}>
                        <FaSpotify size={24} color="#fff" />
                      </a>
                    </aside>
                  </Track>
                ))}
              </TracksList>

              <CloseModal type="button" onClick={setIsOpen}>
                <FaTimes size={24} color="#f7415f" />
              </CloseModal>
            </Content>
          </>
        )}
      </Container>
    </Modal>
  );
};

export default ModalPlaylistTracks;
