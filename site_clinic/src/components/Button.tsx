import React from 'react';

// Function to darken a hex color by a percentage
const darkenColor = (color: string, percent: number = 15): string => {
    // Remove # if present
    const hex = color.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Darken each channel
    const darkerR = Math.floor(r * (1 - percent / 100));
    const darkerG = Math.floor(g * (1 - percent / 100));
    const darkerB = Math.floor(b * (1 - percent / 100));
    
    // Convert back to hex
    return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
};

// Function to create shadow color from button color
const createShadowColor = (color: string, alpha: number = 0.2): string => {
    // Remove # if present
    const hex = color.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Return rgba color
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface ButtonProps {
    buttonColor: string;
    buttonHoverColor?: string;
    buttonText: string;
    buttonIcon: React.ReactNode;
    href: string;
    target?: '_self' | '_blank';
}

const Button: React.FC<ButtonProps> = ({
    buttonColor,
    buttonHoverColor,
    buttonText,
    buttonIcon,
    href,
    target = '_self'
}) => {
    // Auto-generate hover color if not provided
    const hoverColor = buttonHoverColor || darkenColor(buttonColor, 15);
    
    // Auto-generate shadow colors
    const shadowColor = createShadowColor(buttonColor, 0.2);
    const hoverShadowColor = createShadowColor(buttonColor, 0.3);
    
    return (
        <a
            href={href}
            target={target}
            rel={target === '_blank' ? 'noopener noreferrer' : undefined}
            className="generic-button"
            style={{ 
                backgroundColor: buttonColor,
                boxShadow: `0 4px 15px ${shadowColor}`
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = hoverColor;
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = `0 6px 20px ${hoverShadowColor}`;
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = buttonColor;
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = `0 4px 15px ${shadowColor}`;
            }}
        >
            {buttonIcon}
            <span>{buttonText}</span>
        </a>
    );
};

export default Button;
