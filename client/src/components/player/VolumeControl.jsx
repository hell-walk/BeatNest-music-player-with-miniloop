import { usePlayer } from '../../context/PlayerContext.jsx';
import { VolumeIcon, VolumeMuteIcon } from '../icons.jsx';
import Button from '../ui/Button.jsx';

export default function VolumeControl() {
  const { volume, muted, actions } = usePlayer();
  const effective = muted ? 0 : volume;
  const percent = Math.round(effective * 100);

  return (
    <div className="volume">
      <Button variant="icon" aria-label={muted ? 'Unmute' : 'Mute'} aria-pressed={muted} onClick={actions.toggleMute}>
        {effective === 0 ? <VolumeMuteIcon size={20} /> : <VolumeIcon size={20} />}
      </Button>
      <input
        type="range"
        className="range volume__range"
        min={0}
        max={1}
        step={0.01}
        value={effective}
        aria-label="Volume"
        aria-valuetext={`${percent}%`}
        style={{ '--pct': `${percent}%` }}
        onChange={(event) => actions.setVolume(Number(event.target.value))}
      />
    </div>
  );
}
