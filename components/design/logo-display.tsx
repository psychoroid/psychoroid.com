import BaseRetroDisplay from './retro-display'

export default function ClassicGreenDisplay() {
    return (
        <BaseRetroDisplay
            text="psychoroid.com"
            dotSize={1}
            gap={0.5}
            color="#33ff33"
            backgroundColor="#000000"
        />
    )
}