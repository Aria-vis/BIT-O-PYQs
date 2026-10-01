import { InfinitySquareSnake } from './InfinitySquareSnake';

export default function Spinner({ text = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <InfinitySquareSnake className="text-[#FF9FFC] text-3xl [--duration:2s]" />
      <span className="text-gray-500 dark:text-gray-400 font-medium">{text}</span>
    </div>
  );
}