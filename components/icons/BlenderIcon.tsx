interface IconProps {
    width?: number;
    height?: number;
    className?: string;
}

export function BlenderIcon({ width = 24, height = 24, className }: IconProps) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width={width}
            height={height}
            viewBox="0 0 24 24"
            className={className}
            fill="currentColor"
        >
            <path d="M12.51 13.53c.28.3.5.64.67 1.01.16.34.27.7.33 1.07.06.37.06.75 0 1.12-.06.37-.17.73-.33 1.07-.16.37-.39.71-.67 1.01-.29.31-.62.56-.99.75-.37.19-.77.32-1.18.39-.41.07-.83.07-1.24 0-.41-.07-.81-.2-1.18-.39-.37-.19-.7-.44-.99-.75-.28-.3-.5-.64-.67-1.01-.16-.34-.27-.7-.33-1.07-.06-.37-.06-.75 0-1.12.06-.37.17-.73.33-1.07.16-.37.39-.71.67-1.01.29-.31.62-.56.99-.75.37-.19.77-.32 1.18-.39.41-.07.83-.07 1.24 0 .41.07.81.2 1.18.39.37.19.7.44.99.75zm-3.51-7.8L2.09 9.57c-.07.03-.12.08-.15.15-.03.07-.03.14 0 .21.03.07.08.12.15.15l12.79 5.84c.07.03.14.03.21 0 .07-.03.12-.08.15-.15.03-.07.03-.14 0-.21L11.39 9.72c-.03-.07-.08-.12-.15-.15-.07-.03-.14-.03-.21 0l-2.03.93zm11.49 7.8c.28.3.5.64.67 1.01.16.34.27.7.33 1.07.06.37.06.75 0 1.12-.06.37-.17.73-.33 1.07-.16.37-.39.71-.67 1.01-.29.31-.62.56-.99.75-.37.19-.77.32-1.18.39-.41.07-.83.07-1.24 0-.41-.07-.81-.2-1.18-.39-.37-.19-.7-.44-.99-.75-.28-.3-.5-.64-.67-1.01-.16-.34-.27-.7-.33-1.07-.06-.37-.06-.75 0-1.12.06-.37.17-.73.33-1.07.16-.37.39-.71.67-1.01.29-.31.62-.56.99-.75.37-.19.77-.32 1.18-.39.41-.07.83-.07 1.24 0 .41.07.81.2 1.18.39.37.19.7.44.99.75z" />
        </svg>
    );
}