interface PixelSpriteProps {
  spriteKey: string;
  size?: number;
}

/**
 * Crisp pixel-grid SVG sprites for starter garden plants, decor, and tools.
 * Uses integer viewBox (16x16) and shape-rendering="crispEdges" so sprites
 * remain sharp at any isometric zoom level.
 */
export function PixelSprite({ spriteKey, size = 36 }: PixelSpriteProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className="pixel-art select-none"
      aria-hidden="true"
    >
      {renderSpritePixels(spriteKey)}
    </svg>
  );
}

function renderSpritePixels(spriteKey: string) {
  switch (spriteKey) {
    case 'sprout_pot':
      return (
        <>
          <rect x="5" y="10" width="6" height="4" fill="#D97757" />
          <rect x="4" y="9" width="8" height="2" fill="#E08E6D" />
          <rect x="6" y="9" width="4" height="1" fill="#6E473B" />
          <rect x="7" y="5" width="2" height="4" fill="#5A8F5E" />
          <rect x="4" y="4" width="3" height="2" fill="#7BAE7F" />
          <rect x="9" y="3" width="3" height="2" fill="#95C98E" />
        </>
      );
    case 'sunlit_daisy':
      return (
        <>
          <rect x="7" y="8" width="2" height="6" fill="#5A8F5E" />
          <rect x="5" y="11" width="2" height="1" fill="#7BAE7F" />
          <rect x="9" y="10" width="2" height="1" fill="#7BAE7F" />
          <rect x="6" y="3" width="4" height="2" fill="#FFFDF7" />
          <rect x="6" y="7" width="4" height="2" fill="#FFFDF7" />
          <rect x="4" y="5" width="2" height="2" fill="#FFFDF7" />
          <rect x="10" y="5" width="2" height="2" fill="#FFFDF7" />
          <rect x="6" y="5" width="4" height="2" fill="#F4B942" />
        </>
      );
    case 'lavender_bush':
      return (
        <>
          <rect x="4" y="9" width="8" height="5" fill="#5A8F5E" />
          <rect x="3" y="10" width="10" height="3" fill="#7BAE7F" />
          <rect x="4" y="4" width="2" height="5" fill="#9D79BC" />
          <rect x="7" y="3" width="2" height="6" fill="#B592D6" />
          <rect x="10" y="5" width="2" height="4" fill="#9D79BC" />
        </>
      );
    case 'stepping_stone':
      return (
        <>
          <rect x="3" y="9" width="10" height="4" fill="#A8A29E" />
          <rect x="4" y="8" width="8" height="4" fill="#D6D3D1" />
          <rect x="5" y="9" width="2" height="1" fill="#E7E5E4" />
          <rect x="3" y="11" width="2" height="2" fill="#7BAE7F" />
          <rect x="11" y="10" width="2" height="2" fill="#7BAE7F" />
        </>
      );
    case 'wooden_lantern':
      return (
        <>
          <rect x="6" y="12" width="4" height="2" fill="#5C4033" />
          <rect x="5" y="5" width="6" height="7" fill="#7C5844" />
          <rect x="6" y="6" width="4" height="5" fill="#FDE68A" />
          <rect x="7" y="7" width="2" height="3" fill="#F59E0B" />
          <rect x="4" y="4" width="8" height="2" fill="#5C4033" />
          <rect x="6" y="3" width="4" height="1" fill="#5C4033" />
        </>
      );
    case 'watering_can':
      return (
        <>
          <rect x="5" y="8" width="6" height="5" fill="#D97757" />
          <rect x="6" y="7" width="4" height="1" fill="#E08E6D" />
          <rect x="3" y="8" width="2" height="3" fill="#B45309" />
          <rect x="11" y="6" width="2" height="4" fill="#D97757" />
          <rect x="13" y="5" width="1" height="2" fill="#F59E0B" />
        </>
      );
    default:
      return <rect x="5" y="5" width="6" height="6" fill="#7BAE7F" />;
  }
}

