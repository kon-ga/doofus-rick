import { Quote } from '@/components/quote'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { edenFetch } from '@elysiajs/eden'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import type { Server } from '../../../server/src/elysia/Server'
import { Button } from '@/components/ui/button'
import { useSearchParams } from 'react-router-dom'

const SKELETON_COUNT = 3
const DISCORD_URL =
    'https://discord.com/oauth2/authorize?client_id=914651266758627359&response_type=code&redirect_uri=https%3A%2F%2Fdoofus-rick.josholaus.com&scope=identify'

const fetch = edenFetch<Server>(
    process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://doofus-rick-api.josholaus.com',
)

function RootIndex() {
    const [loading, setLoading] = useState(false)
    const [quotes, setQuotes] = useState<Quote[]>([])
    const [search, setSearch] = useState<string>('')
    const [searchParams] = useSearchParams()

    const computedQuotes = useMemo(
        () =>
            quotes.filter(
                (quote) => search.length == 0 || quote.content.toLocaleLowerCase().includes(search.toLocaleLowerCase()),
            ),
        [quotes, search],
    )

    const onSearch = (event: ChangeEvent<HTMLInputElement>) => {
        const value = event.target.value
        setSearch(value)
    }

    useEffect(() => {
        setLoading(true)
        fetch('/quote/', {}).then((response) => {
            setLoading(false)
            if (response.data) setQuotes(response.data)
        })
    }, [])

    if (!searchParams.get('code')) {
        return (
            <div className="flex justify-center w-full">
                <Button
                    onClick={() => {
                        window.location.href = DISCORD_URL
                    }}>
                    Log in with Discord
                </Button>
            </div>
        )
    }

    return (
        <>
            <Input placeholder="Search..." onChange={onSearch} />
            <section className="flex flex-col space-y-4">
                {loading
                    ? Array.from({ length: SKELETON_COUNT }).map((_, index) => (
                          <Skeleton key={index} className="w-full h-48 rounded-xl bg-zinc-900" />
                      ))
                    : computedQuotes.map((quote) => <Quote key={quote._id} quote={quote} />)}
                {!loading && computedQuotes.length == 0 && (
                    <div className="flex items-center flex-col space-y-8">
                        <img className="h-52" src="/poopybutthole.png" alt="Mr. Poopybutthole" />
                        <p className="font-semibold italic text-lg">ooh wee</p>
                    </div>
                )}
            </section>
        </>
    )
}

export default RootIndex
