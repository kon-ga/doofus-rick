interface ButtonProps {
    onClick: () => void
    children: React.ReactNode
}

function Button(props: ButtonProps) {
    return (
        <button
            onClick={props.onClick}
            className="bg-slate-200 py-2 px-6 w-fit text-zinc-950 font-semibold rounded-xl shadow-md hover:bg-slate-100 transition-colors focus:ring-1 ring-slate-200 ring-offset-2">
            {props.children}
        </button>
    )
}

export { Button }
