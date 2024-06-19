const Icon = ({name, size = 24, color = 'currentColor', ...rest}: {name: string, size: number, color: string}) => {

    return (
        <svg width={size} height={size} fill={color} {...rest} aria-hidden="true">
            <use xlinkHref={`icon-${name}`} />
        </svg>
    )
}

export default Icon;